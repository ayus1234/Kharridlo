from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field, computed_field


class MarketplaceProductImageResponse(BaseModel):
    id: Optional[str] = None
    source_url: str
    image_type: str = "gallery"  # 'primary', 'thumbnail', 'gallery'
    width: Optional[int] = None
    height: Optional[int] = None
    alt_text: Optional[str] = None
    sort_order: int = 0
    is_primary: bool = False

    model_config = ConfigDict(from_attributes=True)


class MarketplaceOfferResponse(BaseModel):
    id: Optional[str] = None
    provider_offer_id: Optional[str] = None
    seller_name: Optional[str] = None
    offer_title: str
    offer_description: Optional[str] = None
    price_minor: Optional[int] = None
    currency: str = "INR"
    discount_minor: Optional[int] = None
    discount_percentage: Optional[float] = None
    availability: Optional[str] = None
    source_url: Optional[str] = None

    @computed_field
    @property
    def price_inr(self) -> Optional[float]:
        return round(self.price_minor / 100.0, 2) if self.price_minor is not None else None

    @computed_field
    @property
    def discount_inr(self) -> Optional[float]:
        return round(self.discount_minor / 100.0, 2) if self.discount_minor is not None else None

    model_config = ConfigDict(from_attributes=True)


class MarketplaceReviewSummaryResponse(BaseModel):
    rating: float
    review_count: int
    rating_distribution: Dict[str, Any] = Field(default_factory=dict)
    source: str
    fetched_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MarketplaceFinanceResponse(BaseModel):
    emi_available: bool = False
    emi_provider: Optional[str] = None
    emi_summary: Optional[str] = None
    no_cost_emi_available: bool = False
    source_text: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MarketplaceFieldAvailability(BaseModel):
    """Honest tracking of whether fields were authentic vs unavailable from provider."""
    has_original_description: bool = False
    has_images: bool = False
    has_offers: bool = False
    has_reviews: bool = False
    has_emi: bool = False
    has_seller_info: bool = False
    has_mrp: bool = False
    has_specifications: bool = False


class MarketplaceInternalMappingResponse(BaseModel):
    mapping_status: str = "UNMAPPED"  # 'UNMAPPED', 'CANDIDATE', 'VERIFIED', 'DISABLED', 'PRICE_MISMATCH', 'UNAVAILABLE'
    mapping_confidence: float = 0.0
    internal_product_id: Optional[str] = None
    internal_sku: Optional[str] = None
    can_authoritative_checkout: bool = False

    model_config = ConfigDict(from_attributes=True)


class MarketplaceProductResponse(BaseModel):
    id: str
    provider: str  # 'amazon', 'flipkart', 'kharridlo_verified'
    provider_product_id: str
    canonical_url: str
    title: str
    brand: str
    category: str
    subcategory: Optional[str] = None

    # Provenance separation
    original_description: Optional[str] = None
    normalized_description: Optional[str] = None
    ai_summary: Optional[str] = None
    specifications: Dict[str, Any] = Field(default_factory=dict)

    # Pricing
    source_currency: str = "INR"
    source_price_minor: Optional[int] = None
    source_mrp_minor: Optional[int] = None
    availability_status: str = "in_stock"

    # Ratings & Seller
    source_rating: Optional[float] = None
    source_review_count: Optional[int] = None
    seller_name: Optional[str] = None

    # Rich relations
    images: List[MarketplaceProductImageResponse] = Field(default_factory=list)
    primary_image_url: Optional[str] = None
    offers: List[MarketplaceOfferResponse] = Field(default_factory=list)
    review_summary: Optional[MarketplaceReviewSummaryResponse] = None
    finance_info: Optional[MarketplaceFinanceResponse] = None

    # Gating & Provenance metadata
    fetched_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    field_availability: MarketplaceFieldAvailability = Field(default_factory=MarketplaceFieldAvailability)
    mapping: Optional[MarketplaceInternalMappingResponse] = None

    @computed_field
    @property
    def source_price_inr(self) -> Optional[float]:
        return round(self.source_price_minor / 100.0, 2) if self.source_price_minor is not None else None

    @computed_field
    @property
    def source_mrp_inr(self) -> Optional[float]:
        return round(self.source_mrp_minor / 100.0, 2) if self.source_mrp_minor is not None else None

    @computed_field
    @property
    def savings_inr(self) -> Optional[float]:
        if self.source_mrp_minor is not None and self.source_price_minor is not None:
            diff = self.source_mrp_minor - self.source_price_minor
            return round(diff / 100.0, 2) if diff > 0 else 0.0
        return None

    model_config = ConfigDict(from_attributes=True)


class MarketplaceSearchResponse(BaseModel):
    items: List[MarketplaceProductResponse] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    page_size: int = 20
    query: Optional[str] = None
    providers_queried: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class MarketplaceProviderStatusResponse(BaseModel):
    code: str
    display_name: str
    enabled: bool
    status: str  # 'active', 'degraded', 'unavailable', 'rate_limited'
    live_access_verified: bool = False
    last_success_at: Optional[datetime] = None
    last_error_at: Optional[datetime] = None
    last_error_message: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
