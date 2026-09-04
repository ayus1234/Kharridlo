from typing import Optional, List, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from app.models.cart import Cart, CartItem, get_default_cart_expiry
from app.models.product import Product
from app.models.inventory import Inventory
from app.services.audit_service import AuditService
from app.schemas.audit import AuditEventType


# Custom Domain Exceptions for Machine-Readable API Error Mapping
class CartException(Exception):
    """Base cart domain exception."""
    code: str = "CART_ERROR"

    def __init__(self, message: str, code: Optional[str] = None):
        super().__init__(message)
        if code:
            self.code = code


class CartNotFoundException(CartException):
    code = "CART_NOT_FOUND"


class CartExpiredException(CartException):
    code = "CART_EXPIRED"


class ProductNotFoundException(CartException):
    code = "PRODUCT_NOT_FOUND"


class ProductInactiveException(CartException):
    code = "PRODUCT_INACTIVE"


class OutOfStockException(CartException):
    code = "OUT_OF_STOCK"


class InsufficientStockException(CartException):
    code = "INSUFFICIENT_STOCK"


class InvalidQuantityException(CartException):
    code = "INVALID_QUANTITY"


class ItemNotFoundInCartException(CartException):
    code = "ITEM_NOT_FOUND_IN_CART"


class CartService:

    @staticmethod
    def _release_cart_reservations(db: Session, cart: Cart) -> None:
        """Release all inventory reservations currently held by this cart."""
        for item in cart.items:
            inventory = (
                db.query(Inventory)
                .filter(Inventory.product_id == item.product_id)
                .with_for_update()
                .first()
            )
            if inventory:
                inventory.available_quantity += item.quantity
                inventory.reserved_quantity = max(0, inventory.reserved_quantity - item.quantity)

    @classmethod
    def get_or_create_cart(cls, db: Session, session_id: str) -> Cart:
        """Retrieve existing active cart for session or create a new active cart."""
        cart = (
            db.query(Cart)
            .options(
                joinedload(Cart.items)
                .joinedload(CartItem.product)
                .joinedload(Product.inventory)
            )
            .filter(Cart.session_id == session_id)
            .first()
        )

        if cart:
            # Check for lazy expiration
            if cart.is_expired and cart.status == "active":
                cls._release_cart_reservations(db, cart)
                cart.status = "expired"
                db.commit()
                db.refresh(cart)
            return cart

        # Create new cart
        new_cart = Cart(
            session_id=session_id,
            status="active",
            currency="INR",
            subtotal_paise=0,
            total_paise=0,
            expires_at=get_default_cart_expiry(),
        )
        db.add(new_cart)
        db.commit()
        db.refresh(new_cart)

        AuditService.log_event(
            db=db,
            actor_type="BUYER",
            session_id=session_id,
            event_type=AuditEventType.CART_CREATED.value,
            event_status="succeeded",
            metadata={"cart_id": new_cart.id, "currency": new_cart.currency},
        )
        return new_cart

    @classmethod
    def get_cart(cls, db: Session, session_id: str) -> Optional[Cart]:
        """Fetch cart by session ID with all items and product details preloaded."""
        cart = (
            db.query(Cart)
            .options(
                joinedload(Cart.items)
                .joinedload(CartItem.product)
                .joinedload(Product.inventory)
            )
            .filter(Cart.session_id == session_id)
            .first()
        )
        if cart and cart.is_expired and cart.status == "active":
            cls._release_cart_reservations(db, cart)
            cart.status = "expired"
            db.commit()
            db.refresh(cart)
        return cart

    @classmethod
    def add_item(cls, db: Session, session_id: str, product_id: str, quantity: int = 1) -> Cart:
        """Add product to cart with authoritative price snapshot and inventory reservation."""
        if quantity < 1:
            raise InvalidQuantityException("Quantity must be at least 1 unit.", code="INVALID_QUANTITY")
        if quantity > 100:
            raise InvalidQuantityException("Quantity exceeds maximum allowed batch limit of 100 units.", code="INVALID_QUANTITY")

        cart = cls.get_or_create_cart(db, session_id)
        if cart.status == "expired" or cart.is_expired:
            raise CartExpiredException("Cart session has expired. Please refresh your session.", code="CART_EXPIRED")

        # Resolve Product (lookup by internal ID first, then fallback to SKU)
        product = (
            db.query(Product)
            .filter((Product.id == product_id) | (Product.sku == product_id))
            .first()
        )
        if not product:
            raise ProductNotFoundException(f"Product '{product_id}' not found.", code="PRODUCT_NOT_FOUND")
        if not product.is_active:
            raise ProductInactiveException(f"Product '{product.name}' is no longer active.", code="PRODUCT_INACTIVE")

        # Row-level lock on Inventory
        inventory = (
            db.query(Inventory)
            .filter(Inventory.product_id == product.id)
            .with_for_update()
            .first()
        )
        if not inventory or inventory.available_quantity <= 0:
            raise OutOfStockException(
                f"Product '{product.name}' is currently out of stock.",
                code="OUT_OF_STOCK"
            )

        if inventory.available_quantity < quantity:
            raise InsufficientStockException(
                f"Requested {quantity} units of '{product.name}', but only {inventory.available_quantity} units are available.",
                code="INSUFFICIENT_STOCK"
            )

        # Check if product is already in the cart (Idempotent addition)
        existing_item = next((item for item in cart.items if item.product_id == product.id), None)

        if existing_item:
            # Adding more of an existing item
            new_quantity = existing_item.quantity + quantity
            existing_item.quantity = new_quantity
            existing_item.line_total_paise = existing_item.unit_price_paise * new_quantity
        else:
            # New line item with authoritative price snapshot
            new_item = CartItem(
                cart_id=cart.id,
                product_id=product.id,
                quantity=quantity,
                unit_price_paise=product.price_paise,
                line_total_paise=product.price_paise * quantity,
            )
            db.add(new_item)
            cart.items.append(new_item)

        # Execute Inventory Reservation
        inventory.available_quantity -= quantity
        inventory.reserved_quantity += quantity

        # Recalculate authoritative totals in integer paise
        cart.subtotal_paise = sum(item.line_total_paise for item in cart.items)
        cart.total_paise = cart.subtotal_paise
        cart.expires_at = get_default_cart_expiry()  # Extend expiration on activity

        db.commit()
        db.refresh(cart)

        AuditService.log_event(
            db=db,
            actor_type="BUYER",
            session_id=session_id,
            event_type=AuditEventType.INVENTORY_RESERVED.value,
            event_status="succeeded",
            product_id=product.id,
            metadata={"sku": product.sku, "quantity": quantity, "reserved_quantity": inventory.reserved_quantity},
        )
        AuditService.log_event(
            db=db,
            actor_type="BUYER",
            session_id=session_id,
            event_type=AuditEventType.CART_ITEM_ADDED.value,
            event_status="succeeded",
            product_id=product.id,
            metadata={"sku": product.sku, "quantity": quantity, "total_paise": cart.total_paise},
        )
        return cart

    @classmethod
    def update_item_quantity(cls, db: Session, session_id: str, product_id: str, quantity: int) -> Cart:
        """Update line item quantity with deterministic reservation adjustment."""
        if quantity < 1:
            raise InvalidQuantityException("Quantity must be at least 1 unit. Use remove to delete.", code="INVALID_QUANTITY")
        if quantity > 100:
            raise InvalidQuantityException("Quantity exceeds maximum allowed batch limit of 100 units.", code="INVALID_QUANTITY")

        cart = cls.get_cart(db, session_id)
        if not cart:
            raise CartNotFoundException(f"Cart for session '{session_id}' not found.", code="CART_NOT_FOUND")
        if cart.status == "expired" or cart.is_expired:
            raise CartExpiredException("Cart session has expired.", code="CART_EXPIRED")

        item = next(
            (i for i in cart.items if i.product_id == product_id or (i.product and i.product.sku == product_id)),
            None
        )
        if not item:
            raise ItemNotFoundInCartException(f"Product '{product_id}' not found in cart.", code="ITEM_NOT_FOUND_IN_CART")

        delta = quantity - item.quantity
        if delta == 0:
            return cart

        inventory = (
            db.query(Inventory)
            .filter(Inventory.product_id == item.product_id)
            .with_for_update()
            .first()
        )
        if not inventory:
            raise OutOfStockException("Inventory record not found for product.", code="OUT_OF_STOCK")

        if delta > 0:
            # Need to reserve more
            if inventory.available_quantity < delta:
                raise InsufficientStockException(
                    f"Cannot increase quantity by {delta}; only {inventory.available_quantity} additional units available.",
                    code="INSUFFICIENT_STOCK"
                )
            inventory.available_quantity -= delta
            inventory.reserved_quantity += delta
        else:
            # Need to release reservation
            release_qty = abs(delta)
            inventory.available_quantity += release_qty
            inventory.reserved_quantity = max(0, inventory.reserved_quantity - release_qty)

        item.quantity = quantity
        item.line_total_paise = item.unit_price_paise * quantity

        cart.subtotal_paise = sum(i.line_total_paise for i in cart.items)
        cart.total_paise = cart.subtotal_paise
        cart.expires_at = get_default_cart_expiry()

        db.commit()
        db.refresh(cart)

        AuditService.log_event(
            db=db,
            actor_type="BUYER",
            session_id=session_id,
            event_type=AuditEventType.CART_ITEM_UPDATED.value,
            event_status="succeeded",
            product_id=item.product_id,
            metadata={"new_quantity": quantity, "total_paise": cart.total_paise},
        )
        return cart

    @classmethod
    def remove_item(cls, db: Session, session_id: str, product_id: str) -> Cart:
        """Remove product from cart and release its inventory reservation safely (even on expired sessions)."""
        cart = cls.get_cart(db, session_id)
        if not cart:
            raise CartNotFoundException(f"Cart for session '{session_id}' not found.", code="CART_NOT_FOUND")

        item = next(
            (i for i in cart.items if i.product_id == product_id or (i.product and i.product.sku == product_id)),
            None
        )
        if not item:
            raise ItemNotFoundInCartException(f"Product '{product_id}' not found in cart.", code="ITEM_NOT_FOUND_IN_CART")

        # Release reservation if cart was active (if expired, reservations were already released by get_cart)
        if cart.status == "active" and not cart.is_expired:
            inventory = (
                db.query(Inventory)
                .filter(Inventory.product_id == item.product_id)
                .with_for_update()
                .first()
            )
            if inventory:
                inventory.available_quantity += item.quantity
                inventory.reserved_quantity = max(0, inventory.reserved_quantity - item.quantity)

            AuditService.log_event(
                db=db,
                actor_type="BUYER",
                session_id=session_id,
                event_type=AuditEventType.INVENTORY_RESERVATION_RELEASED.value,
                event_status="succeeded",
                product_id=item.product_id,
                metadata={"released_quantity": item.quantity},
            )

        saved_product_id = item.product_id
        saved_qty = item.quantity
        db.delete(item)
        cart.items = [i for i in cart.items if i.id != item.id]

        cart.subtotal_paise = sum(i.line_total_paise for i in cart.items)
        cart.total_paise = cart.subtotal_paise
        if len(cart.items) == 0:
            cart.status = "active"
        cart.expires_at = get_default_cart_expiry()

        db.commit()
        db.refresh(cart)

        AuditService.log_event(
            db=db,
            actor_type="BUYER",
            session_id=session_id,
            event_type=AuditEventType.CART_ITEM_REMOVED.value,
            event_status="succeeded",
            product_id=saved_product_id,
            metadata={"removed_quantity": saved_qty, "total_paise": cart.total_paise},
        )
        return cart

    @classmethod
    def clear_cart(cls, db: Session, session_id: str) -> Cart:
        """Remove all items from cart and release all reservations."""
        cart = cls.get_cart(db, session_id)
        if not cart:
            cart = cls.get_or_create_cart(db, session_id)
            return cart

        # Release all reservations
        cls._release_cart_reservations(db, cart)

        for item in cart.items:
            db.delete(item)

        cart.items = []
        cart.subtotal_paise = 0
        cart.total_paise = 0
        cart.status = "active"
        cart.expires_at = get_default_cart_expiry()

        db.commit()
        db.refresh(cart)

        AuditService.log_event(
            db=db,
            actor_type="BUYER",
            session_id=session_id,
            event_type=AuditEventType.CART_CLEARED.value,
            event_status="succeeded",
            metadata={"cart_id": cart.id},
        )
        return cart

    @classmethod
    def validate_cart(cls, db: Session, session_id: str) -> Tuple[bool, List[dict], Optional[Cart]]:
        """
        Validate cart fulfillability against active products and current inventory.
        Does NOT execute payment or policy decisions.
        """
        cart = cls.get_cart(db, session_id)
        if not cart:
            return False, [{"code": "CART_NOT_FOUND", "message": "Cart does not exist."}], None

        if cart.status == "expired" or cart.is_expired:
            return False, [{"code": "CART_EXPIRED", "message": "Cart session has expired."}], cart

        if len(cart.items) == 0:
            return False, [{"code": "EMPTY_CART", "message": "Cart contains no items."}], cart

        issues: List[dict] = []
        for item in cart.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product or not product.is_active:
                issues.append({
                    "code": "PRODUCT_INACTIVE",
                    "product_id": item.product_id,
                    "message": f"Product '{item.product_id}' is no longer active."
                })
                continue

            # Check inventory consistency
            inventory = db.query(Inventory).filter(Inventory.product_id == item.product_id).first()
            if not inventory:
                issues.append({
                    "code": "OUT_OF_STOCK",
                    "product_id": item.product_id,
                    "message": f"Inventory record missing for '{product.name}'."
                })
            elif inventory.reserved_quantity < item.quantity:
                issues.append({
                    "code": "INSUFFICIENT_STOCK",
                    "product_id": item.product_id,
                    "message": f"Reserved stock for '{product.name}' is less than cart quantity."
                })

        is_valid = len(issues) == 0
        return is_valid, issues, cart

    @classmethod
    def expire_cart_explicitly(cls, db: Session, session_id: str) -> Cart:
        """Force cart expiration immediately and release all held inventory (useful for testing)."""
        cart = cls.get_cart(db, session_id)
        if not cart:
            raise CartNotFoundException("Cart not found.", code="CART_NOT_FOUND")

        cls._release_cart_reservations(db, cart)
        cart.status = "expired"
        cart.expires_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(cart)
        return cart

    @classmethod
    def finalize_cart_checkout(cls, db: Session, cart: Cart) -> Cart:
        """
        Finalize inventory consumption upon verified payment capture.
        Converts reserved quantity into permanently consumed stock without double-decrementing.
        Marks cart as 'converted'.
        """
        if cart.status == "converted":
            AuditService.log_event(
                db=db,
                actor_type="SYSTEM",
                session_id=cart.session_id,
                event_type=AuditEventType.INVENTORY_FINALIZATION_SKIPPED.value,
                event_status="succeeded",
                reason_code="ALREADY_CONVERTED",
                metadata={"cart_id": cart.id},
            )
            return cart

        AuditService.log_event(
            db=db,
            actor_type="SYSTEM",
            session_id=cart.session_id,
            event_type=AuditEventType.INVENTORY_FINALIZATION_STARTED.value,
            event_status="attempted",
            metadata={"cart_id": cart.id, "item_count": len(cart.items)},
        )

        for item in cart.items:
            inventory = (
                db.query(Inventory)
                .filter(Inventory.product_id == item.product_id)
                .with_for_update()
                .first()
            )
            if inventory:
                # Deduct from reserved quantity without adding back to available
                inventory.reserved_quantity = max(0, inventory.reserved_quantity - item.quantity)

        cart.status = "converted"
        cart.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(cart)

        AuditService.log_event(
            db=db,
            actor_type="SYSTEM",
            session_id=cart.session_id,
            event_type=AuditEventType.INVENTORY_FINALIZED.value,
            event_status="succeeded",
            metadata={"cart_id": cart.id, "total_paise": cart.total_paise},
        )
        return cart

    @classmethod
    def release_cart_reservations(cls, db: Session, cart: Cart) -> Cart:
        """
        Safely return all reserved inventory for this cart back to available quantity.
        Used on explicit checkout cancellation or payment abandonment.
        """
        if cart.status == "converted":
            return cart

        cls._release_cart_reservations(db, cart)
        cart.status = "active"
        db.commit()
        db.refresh(cart)
        return cart
