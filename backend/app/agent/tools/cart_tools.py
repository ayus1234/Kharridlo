from typing import Dict, Any
from app.agent.context import AgentRequestContext
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


def _format_cart_summary(cart) -> Dict[str, Any]:
    """Helper to convert Cart model into a clean, safe dictionary for LLM consumption."""
    items = []
    for item in cart.items:
        p = item.product
        items.append({
            "product_id": item.product_id,
            "sku": p.sku if p else "UNKNOWN",
            "name": f"<untrusted_catalog_data>{p.name if p else 'Unknown'}</untrusted_catalog_data>",
            "quantity": item.quantity,
            "unit_price_paise": item.unit_price_paise,
            "unit_price_inr": round(item.unit_price_paise / 100.0, 2),
            "line_total_paise": item.line_total_paise,
            "line_total_inr": round(item.line_total_paise / 100.0, 2),
        })

    return {
        "cart_id": cart.id,
        "session_id": cart.session_id,
        "status": cart.status,
        "currency": cart.currency,
        "subtotal_paise": cart.subtotal_paise,
        "subtotal_inr": round(cart.subtotal_paise / 100.0, 2),
        "total_paise": cart.total_paise,
        "total_inr": round(cart.total_paise / 100.0, 2),
        "total_items_count": sum(i.quantity for i in cart.items),
        "is_expired": cart.is_expired,
        "items": items,
    }


def get_cart(context: AgentRequestContext) -> Dict[str, Any]:
    """
    Retrieve the current session's active cart and authoritative total in integer paise.
    Session identity is bound strictly from the application context.
    """
    db = context.db
    cart = CartService.get_or_create_cart(db, context.session_id)
    return {
        "success": True,
        "cart": _format_cart_summary(cart),
    }


def add_to_cart(
    context: AgentRequestContext,
    product_id: str,
    quantity: int = 1,
) -> Dict[str, Any]:
    """
    Add a product to the buyer's cart with inventory reservation and price snapshotting.
    The tool calls the authoritative CartService. Client-side prices or totals are strictly forbidden.
    Requires explicit buyer request.
    """
    safe_qty = max(1, min(quantity, 10))
    db = context.db

    try:
        cart = CartService.add_item(
            db=db,
            session_id=context.session_id,
            product_id=product_id.strip(),
            quantity=safe_qty,
        )
        return {
            "success": True,
            "action": "item_added",
            "added_product_id": product_id,
            "quantity_added": safe_qty,
            "cart": _format_cart_summary(cart),
        }
    except ProductNotFoundException:
        return {
            "success": False,
            "error_code": "PRODUCT_NOT_FOUND",
            "message": f"Product '{product_id}' does not exist in catalog.",
        }
    except OutOfStockException:
        return {
            "success": False,
            "error_code": "OUT_OF_STOCK",
            "message": f"Product '{product_id}' is currently out of stock. Cannot add to cart.",
        }
    except InsufficientStockException as e:
        return {
            "success": False,
            "error_code": "INSUFFICIENT_STOCK",
            "message": str(e),
        }
    except CartExpiredException:
        return {
            "success": False,
            "error_code": "CART_EXPIRED",
            "message": "Cart session has expired. Please refresh your cart.",
        }
    except Exception as e:
        return {
            "success": False,
            "error_code": "CART_ERROR",
            "message": str(e),
        }


def update_cart_item(
    context: AgentRequestContext,
    product_id: str,
    quantity: int,
) -> Dict[str, Any]:
    """
    Update quantity of an item already in the cart with delta inventory reservation adjustment.
    """
    if quantity < 1:
        return {
            "success": False,
            "error_code": "INVALID_QUANTITY",
            "message": "Quantity must be at least 1. Use remove_from_cart to delete.",
        }

    safe_qty = min(quantity, 10)
    db = context.db

    try:
        cart = CartService.update_item_quantity(
            db=db,
            session_id=context.session_id,
            product_id=product_id.strip(),
            quantity=safe_qty,
        )
        return {
            "success": True,
            "action": "item_updated",
            "product_id": product_id,
            "new_quantity": safe_qty,
            "cart": _format_cart_summary(cart),
        }
    except ItemNotFoundInCartException:
        return {
            "success": False,
            "error_code": "ITEM_NOT_FOUND_IN_CART",
            "message": f"Product '{product_id}' is not in your cart.",
        }
    except (OutOfStockException, InsufficientStockException) as e:
        return {
            "success": False,
            "error_code": "INSUFFICIENT_STOCK",
            "message": str(e),
        }
    except Exception as e:
        return {
            "success": False,
            "error_code": "CART_ERROR",
            "message": str(e),
        }


def remove_from_cart(
    context: AgentRequestContext,
    product_id: str,
) -> Dict[str, Any]:
    """
    Remove an item from the cart and release its inventory reservation back to stock.
    """
    db = context.db
    try:
        cart = CartService.remove_item(
            db=db,
            session_id=context.session_id,
            product_id=product_id.strip(),
        )
        return {
            "success": True,
            "action": "item_removed",
            "removed_product_id": product_id,
            "cart": _format_cart_summary(cart),
        }
    except ItemNotFoundInCartException:
        return {
            "success": False,
            "error_code": "ITEM_NOT_FOUND_IN_CART",
            "message": f"Product '{product_id}' is not in your cart.",
        }
    except Exception as e:
        return {
            "success": False,
            "error_code": "CART_ERROR",
            "message": str(e),
        }
