from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status, Header
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.marketplace.services.marketplace_service import MarketplaceService
from app.marketplace.services.mapping_service import MappingService
from app.schemas.marketplace import (
    MarketplaceSearchResponse,
    MarketplaceProductResponse,
    MarketplaceProviderStatusResponse,
    MarketplaceInternalMappingResponse,
)

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])


@router.get("/providers", response_model=List[MarketplaceProviderStatusResponse])
def get_providers_status(db: Session = Depends(get_db)) -> List[MarketplaceProviderStatusResponse]:
    """Retrieve operational status and live verification state for all registered marketplace providers."""
    providers = MarketplaceService.get_providers_status(db)
    return [MarketplaceProviderStatusResponse.model_validate(p) for p in providers]


@router.get("/search", response_model=MarketplaceSearchResponse)
def search_marketplace(
    q: str = Query("", max_length=100, description="Product search keyword"),
    provider: str = Query("all", description="Target provider ('all', 'amazon', 'flipkart', 'kharridlo_verified')"),
    category: Optional[str] = Query(None, description="Product category filter"),
    min_price_inr: Optional[float] = Query(None, ge=0, description="Minimum price in INR"),
    max_price_inr: Optional[float] = Query(None, ge=0, description="Maximum price in INR"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=50, description="Items per page"),
    x_request_id: Optional[str] = Header(None, alias="X-Request-ID"),
    db: Session = Depends(get_db),
) -> MarketplaceSearchResponse:
    """
    Search normalized marketplace data across Amazon Creators API, Flipkart Affiliate API,
    and Kharridlo Verified catalog. Enforces caching, deduplication, and provenance transparency.
    """
    min_paise = round(min_price_inr * 100) if min_price_inr is not None else None
    max_paise = round(max_price_inr * 100) if max_price_inr is not None else None

    result = MarketplaceService.search_all(
        db=db,
        query=q,
        provider=provider.lower().strip(),
        category=category,
        min_price_paise=min_paise,
        max_price_paise=max_paise,
        page=page,
        page_size=page_size,
        correlation_id=x_request_id,
    )

    return MarketplaceSearchResponse(
        items=[MarketplaceProductResponse.model_validate(item) for item in result["items"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        query=result["query"],
        providers_queried=result["providers_queried"],
        warnings=result["warnings"],
    )


@router.get("/products/{provider}/{provider_product_id}", response_model=MarketplaceProductResponse)
def get_marketplace_product(
    provider: str,
    provider_product_id: str,
    x_request_id: Optional[str] = Header(None, alias="X-Request-ID"),
    db: Session = Depends(get_db),
) -> MarketplaceProductResponse:
    """
    Retrieve single normalized product specification, real image gallery, and authentic offers
    from Amazon Creators API, Flipkart Affiliate API, or Kharridlo Verified.
    """
    product = MarketplaceService.get_product(
        db=db,
        provider=provider.lower().strip(),
        provider_product_id=provider_product_id.strip(),
        correlation_id=x_request_id,
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Marketplace product '{provider_product_id}' not found under provider '{provider}'.",
        )
    return MarketplaceProductResponse.model_validate(product)


@router.get("/mappings/{provider}/{provider_product_id}", response_model=MarketplaceInternalMappingResponse)
def get_marketplace_mapping(
    provider: str,
    provider_product_id: str,
    db: Session = Depends(get_db),
) -> MarketplaceInternalMappingResponse:
    """
    Inspect the Commerce Authority Boundary mapping status for an external marketplace product.
    Only products with mapping_status='VERIFIED' can enter the authoritative cart and Razorpay gate.
    """
    mapping = MappingService.get_mapping(db, provider.lower().strip(), provider_product_id.strip())
    if not mapping:
        return MarketplaceInternalMappingResponse(
            mapping_status="UNMAPPED",
            mapping_confidence=0.0,
            internal_product_id=None,
            internal_sku=None,
            can_authoritative_checkout=False,
        )
    return MarketplaceInternalMappingResponse(
        mapping_status=str(mapping.mapping_status),
        mapping_confidence=float(mapping.mapping_confidence),
        internal_product_id=str(mapping.internal_product_id) if mapping.internal_product_id else None,
        internal_sku=str(mapping.internal_product.sku) if (mapping.internal_product and mapping.internal_product.sku) else None,
        can_authoritative_checkout=bool(mapping.mapping_status == "VERIFIED"),
    )
