from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.cart import Cart
from app.services.cart_service import (
    CartService,
    CartNotFoundException,
    CartExpiredException,
    ProductNotFoundException,
    ProductInactiveException,
    OutOfStockException,
    InsufficientStockException,
    InvalidQuantityException,
    ItemNotFoundInCartException,
)
from app.schemas.cart import (
    AddCartItemRequest,
    UpdateCartItemRequest,
    CartItemResponse,
    CartResponse,
    CartValidationResponse,
    CartValidationIssue,
)

router = APIRouter(prefix="/cart", tags=["Cart"])


def _to_cart_response(cart: Cart) -> CartResponse:
    """Transform SQLAlchemy Cart model into Pydantic CartResponse."""
    item_responses = []
    for item in cart.items:
        product = item.product
        item_responses.append(
            CartItemResponse(
                id=item.id,
                cart_id=item.cart_id,
                product_id=item.product_id,
                sku=product.sku if product else "UNKNOWN",
                name=product.name if product else "Unknown Product",
                brand=product.brand if product else "Unknown Brand",
                category=product.category if product else "general",
                image_url=product.image_url if product else None,
                quantity=item.quantity,
                unit_price_paise=item.unit_price_paise,
                line_total_paise=item.line_total_paise,
                availability_status=product.inventory.status if (product and product.inventory) else "in_stock",
            )
        )

    return CartResponse(
        id=cart.id,
        session_id=cart.session_id,
        status=cart.status,
        currency=cart.currency,
        subtotal_paise=cart.subtotal_paise,
        total_paise=cart.total_paise,
        expires_at=cart.expires_at,
        is_expired=cart.is_expired,
        items=item_responses,
    )


@router.get("/{session_id}", response_model=CartResponse)
def get_cart(session_id: str, db: Session = Depends(get_db)) -> CartResponse:
    """Fetch or initialize the authoritative cart for the given session."""
    cart = CartService.get_or_create_cart(db, session_id)
    return _to_cart_response(cart)


@router.post("/{session_id}/items", response_model=CartResponse)
def add_cart_item(
    session_id: str,
    payload: AddCartItemRequest,
    db: Session = Depends(get_db),
) -> CartResponse:
    """Add a product to the cart with inventory reservation and price snapshot."""
    try:
        cart = CartService.add_item(
            db=db,
            session_id=session_id,
            product_id=payload.product_id,
            quantity=payload.quantity,
        )
        return _to_cart_response(cart)
    except ProductNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": e.code, "message": str(e)})
    except (ProductInactiveException, OutOfStockException, InsufficientStockException) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"code": e.code, "message": str(e)})
    except InvalidQuantityException as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail={"code": e.code, "message": str(e)})
    except CartExpiredException as e:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail={"code": e.code, "message": str(e)})


@router.patch("/{session_id}/items/{product_id}", response_model=CartResponse)
def update_cart_item(
    session_id: str,
    product_id: str,
    payload: UpdateCartItemRequest,
    db: Session = Depends(get_db),
) -> CartResponse:
    """Update item quantity with deterministic reservation delta adjustment."""
    try:
        cart = CartService.update_item_quantity(
            db=db,
            session_id=session_id,
            product_id=product_id,
            quantity=payload.quantity,
        )
        return _to_cart_response(cart)
    except (CartNotFoundException, ItemNotFoundInCartException) as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": e.code, "message": str(e)})
    except (OutOfStockException, InsufficientStockException) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"code": e.code, "message": str(e)})
    except InvalidQuantityException as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail={"code": e.code, "message": str(e)})
    except CartExpiredException as e:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail={"code": e.code, "message": str(e)})


@router.delete("/{session_id}/items/{product_id}", response_model=CartResponse)
def remove_cart_item(
    session_id: str,
    product_id: str,
    db: Session = Depends(get_db),
) -> CartResponse:
    """Remove a product from the cart and release its reserved stock."""
    try:
        cart = CartService.remove_item(
            db=db,
            session_id=session_id,
            product_id=product_id,
        )
        return _to_cart_response(cart)
    except (CartNotFoundException, ItemNotFoundInCartException) as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": e.code, "message": str(e)})
    except CartExpiredException as e:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail={"code": e.code, "message": str(e)})


@router.delete("/{session_id}", response_model=CartResponse)
def clear_cart(session_id: str, db: Session = Depends(get_db)) -> CartResponse:
    """Clear all items from the cart and release all held reservations."""
    cart = CartService.clear_cart(db, session_id)
    return _to_cart_response(cart)


@router.post("/{session_id}/validate", response_model=CartValidationResponse)
def validate_cart(session_id: str, db: Session = Depends(get_db)) -> CartValidationResponse:
    """Validate cart fulfillability against active products and current inventory."""
    is_valid, issues, cart = CartService.validate_cart(db, session_id)
    cart_response = _to_cart_response(cart) if cart else None
    return CartValidationResponse(
        valid=is_valid,
        issues=[CartValidationIssue(code=i["code"], product_id=i.get("product_id"), message=i["message"]) for i in issues],
        cart=cart_response,
    )


@router.post("/{session_id}/expire", response_model=CartResponse)
def expire_cart_now(session_id: str, db: Session = Depends(get_db)) -> CartResponse:
    """Explicitly expire a cart session and release all held inventory (testing & lifecycle)."""
    try:
        cart = CartService.expire_cart_explicitly(db, session_id)
        return _to_cart_response(cart)
    except CartNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": e.code, "message": str(e)})
