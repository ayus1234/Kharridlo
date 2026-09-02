from typing import Optional, List, Dict, Any
from app.agent.context import AgentRequestContext
from app.services.catalog_service import CatalogService


def search_products(
    context: AgentRequestContext,
    query: Optional[str] = None,
    category: Optional[str] = None,
    max_price_paise: Optional[int] = None,
    in_stock_only: bool = True,
    limit: int = 5,
) -> Dict[str, Any]:
    """
    Search the authoritative DhanKriya product catalog.
    Returns product records with verified prices in integer paise and real-time inventory status.
    All text fields are safely wrapped in <untrusted_catalog_data> to neutralize prompt injection.
    """
    safe_limit = max(1, min(limit, 10))
    db = context.db

    if query and query.strip():
        raw_products, total = CatalogService.search_products(db=db, query_text=query.strip(), limit=safe_limit * 6, offset=0)
        if category and category.strip():
            products = [p for p in raw_products if p.category.lower() == category.strip().lower()]
        else:
            products = raw_products
    else:
        products, total = CatalogService.list_products(
            db=db,
            category=category.strip() if category else None,
            max_price_paise=max_price_paise,
            in_stock_only=in_stock_only,
            limit=safe_limit * 2,
            offset=0,
        )

    # Filter max_price and in_stock_only
    filtered = []
    for p in products:
        status = p.inventory.status if p.inventory else "in_stock"
        if in_stock_only and status == "out_of_stock":
            continue
        if max_price_paise is not None and p.price_paise > max_price_paise:
            continue
        filtered.append((p, status))

    # When a budget limit is specified, sort descending by price so top tier within budget comes first
    if max_price_paise is not None:
        filtered.sort(key=lambda item: item[0].price_paise, reverse=True)

    results = []
    for p, status in filtered[:safe_limit]:
        results.append({
            "id": p.id,
            "sku": p.sku,
            "name": f"<untrusted_catalog_data>{p.name}</untrusted_catalog_data>",
            "brand": p.brand,
            "category": p.category,
            "price_paise": p.price_paise,
            "price_inr": round(p.price_paise / 100.0, 2),
            "currency": p.currency,
            "availability_status": status,
            "description": f"<untrusted_catalog_data>{p.description}</untrusted_catalog_data>",
            "specs": p.specs,
        })

    return {
        "success": True,
        "count": len(results),
        "total_matches": total,
        "products": results,
    }


def get_product(
    context: AgentRequestContext,
    product_id: str,
) -> Dict[str, Any]:
    """
    Retrieve authoritative details for a specific product by its ID or SKU.
    """
    db = context.db
    product = CatalogService.get_product_by_id(db, product_id)
    if not product:
        product = CatalogService.get_product_by_sku(db, product_id)

    if not product:
        return {
            "success": False,
            "error_code": "PRODUCT_NOT_FOUND",
            "message": f"Product '{product_id}' was not found in catalog.",
        }

    status = product.inventory.status if product.inventory else "in_stock"
    return {
        "success": True,
        "product": {
            "id": product.id,
            "sku": product.sku,
            "name": f"<untrusted_catalog_data>{product.name}</untrusted_catalog_data>",
            "brand": product.brand,
            "category": product.category,
            "price_paise": product.price_paise,
            "price_inr": round(product.price_paise / 100.0, 2),
            "currency": product.currency,
            "availability_status": status,
            "description": f"<untrusted_catalog_data>{product.description}</untrusted_catalog_data>",
            "specs": product.specs,
            "available_quantity": product.inventory.available_quantity if product.inventory else 0,
        },
    }
