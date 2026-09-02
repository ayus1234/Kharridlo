from app.agent.tools.catalog_tools import search_products, get_product
from app.agent.tools.cart_tools import get_cart, add_to_cart, update_cart_item, remove_from_cart
from app.agent.tools.policy_tools import evaluate_policy

# Registry of exactly 7 bounded tools
BOUNDED_TOOLS = {
    "search_products": search_products,
    "get_product": get_product,
    "get_cart": get_cart,
    "add_to_cart": add_to_cart,
    "update_cart_item": update_cart_item,
    "remove_from_cart": remove_from_cart,
    "evaluate_policy": evaluate_policy,
}

TOOL_PERMISSIONS = {
    "search_products": "READ",
    "get_product": "READ",
    "get_cart": "READ",
    "evaluate_policy": "READ",
    "add_to_cart": "MUTATION",
    "update_cart_item": "MUTATION",
    "remove_from_cart": "MUTATION",
}

__all__ = [
    "search_products",
    "get_product",
    "get_cart",
    "add_to_cart",
    "update_cart_item",
    "remove_from_cart",
    "evaluate_policy",
    "BOUNDED_TOOLS",
    "TOOL_PERMISSIONS",
]
