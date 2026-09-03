from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.catalog_service import CatalogService
from app.schemas.product import ProductResponse, ProductListResponse
from app.schemas.inventory import InventoryResponse

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=ProductListResponse)
def list_products(
    category: Optional[str] = Query(None, description="Filter by category (e.g. laptop, smartphone)"),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    min_price_inr: Optional[float] = Query(None, ge=0, description="Minimum price in INR"),
    max_price_inr: Optional[float] = Query(None, ge=0, description="Maximum price in INR"),
    in_stock_only: bool = Query(False, description="Filter for products currently in stock"),
    limit: int = Query(20, ge=1, le=100, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset"),
    db: Session = Depends(get_db),
) -> ProductListResponse:
    """List products with deterministic filtering and pagination."""
    # Convert INR float query parameters to integer paise
    min_paise = int(round(min_price_inr * 100)) if min_price_inr is not None else None
    max_paise = int(round(max_price_inr * 100)) if max_price_inr is not None else None

    products, total = CatalogService.list_products(
        db=db,
        category=category,
        brand=brand,
        min_price_paise=min_paise,
        max_price_paise=max_paise,
        in_stock_only=in_stock_only,
        limit=limit,
        offset=offset,
    )

    return ProductListResponse(
        items=[ProductResponse.model_validate(p) for p in products],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/search", response_model=ProductListResponse)
def search_products(
    q: str = Query(..., min_length=1, max_length=100, description="Search keyword"),
    limit: int = Query(20, ge=1, le=100, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset"),
    db: Session = Depends(get_db),
) -> ProductListResponse:
    """Search products deterministically across name, brand, category, and description."""
    products, total = CatalogService.search_products(
        db=db,
        query_text=q,
        limit=limit,
        offset=offset,
    )

    from app.services.audit_service import AuditService
    from app.schemas.audit import AuditEventType
    AuditService.log_event(
        db=db,
        actor_type="BUYER",
        session_id="catalog_browser",
        event_type=AuditEventType.PRODUCT_SEARCHED.value,
        event_status="succeeded",
        metadata={"query": q, "results_count": total},
    )

    return ProductListResponse(
        items=[ProductResponse.model_validate(p) for p in products],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: str,
    db: Session = Depends(get_db),
) -> ProductResponse:
    """Retrieve detailed specifications and availability for a single product."""
    product = CatalogService.get_product_by_id(db=db, product_id=product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID '{product_id}' not found.",
        )

    from app.services.audit_service import AuditService
    from app.schemas.audit import AuditEventType
    AuditService.log_event(
        db=db,
        actor_type="BUYER",
        session_id="catalog_browser",
        event_type=AuditEventType.PRODUCT_VIEWED.value,
        event_status="succeeded",
        product_id=product.id,
        metadata={"sku": product.sku, "name": product.name},
    )

    return ProductResponse.model_validate(product)


@router.get("/{product_id}/inventory", response_model=InventoryResponse)
def get_product_inventory(
    product_id: str,
    db: Session = Depends(get_db),
) -> InventoryResponse:
    """Check deterministic real-time inventory status for a specific product."""
    # Verify product exists first
    product = CatalogService.get_product_by_id(db=db, product_id=product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID '{product_id}' not found.",
        )

    inventory = CatalogService.get_inventory(db=db, product_id=product_id)
    if not inventory:
        # Fallback response for missing inventory record
        return InventoryResponse(
            product_id=product_id,
            available_quantity=0,
            reserved_quantity=0,
            status="out_of_stock",
        )

    return InventoryResponse.model_validate(inventory)
