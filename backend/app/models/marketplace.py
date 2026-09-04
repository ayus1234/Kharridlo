import uuid
from sqlalchemy import (
    Column,
    String,
    Text,
    BigInteger,
    Boolean,
    Float,
    Integer,
    DateTime,
    JSON,
    ForeignKey,
    Index,
    UniqueConstraint,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class MarketplaceProvider(Base):
    """Registry and operational health tracking for external marketplace providers."""
    __tablename__ = "marketplace_providers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(32), unique=True, index=True, nullable=False)  # 'amazon', 'flipkart'
    display_name = Column(String(64), nullable=False)  # 'Amazon.in', 'Flipkart'
    enabled = Column(Boolean, default=False, nullable=False)
    status = Column(String(32), default="unavailable", nullable=False)  # 'active', 'degraded', 'unavailable', 'rate_limited'
    last_success_at = Column(DateTime(timezone=True), nullable=True)
    last_error_at = Column(DateTime(timezone=True), nullable=True)
    last_error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class MarketplaceProduct(Base):
    """
    Normalized marketplace product repository preserving external provenance.
    Strictly decoupled from Kharridlo's authoritative inventory and transactions.
    """
    __tablename__ = "marketplace_products"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    provider = Column(String(32), index=True, nullable=False)  # 'amazon', 'flipkart'
    provider_product_id = Column(String(64), index=True, nullable=False)  # ASIN or FSN
    canonical_url = Column(String(1024), nullable=False)
    title = Column(String(512), nullable=False)
    brand = Column(String(128), index=True, nullable=False, default="Generic")
    category = Column(String(128), index=True, nullable=False, default="General")
    subcategory = Column(String(128), nullable=True)
    
    # Provenance separation: raw external text vs. AI enriched vs. normalized specs
    original_description = Column(Text, nullable=True)
    normalized_description = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    product_attributes = Column(JSON, nullable=False, default=dict)
    specifications = Column(JSON, nullable=False, default=dict)

    # Price in minor integer units (Paise for INR)
    source_currency = Column(String(3), default="INR", nullable=False)
    source_price_minor = Column(BigInteger, nullable=True)  # Current offer price in paise
    source_mrp_minor = Column(BigInteger, nullable=True)  # List price / MRP in paise
    availability_status = Column(String(32), default="in_stock", nullable=False)  # 'in_stock', 'out_of_stock', 'limited_stock', 'unknown'
    
    # Rating & Seller (only populated when authentically supplied by provider)
    source_rating = Column(Float, nullable=True)
    source_review_count = Column(Integer, nullable=True)
    seller_name = Column(String(255), nullable=True)
    
    # Metadata & Tracking
    source_updated_at = Column(DateTime(timezone=True), nullable=True)
    fetched_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    raw_payload_reference = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    images = relationship("MarketplaceProductImage", back_populates="product", cascade="all, delete-orphan", order_by="MarketplaceProductImage.sort_order")
    offers = relationship("MarketplaceOffer", back_populates="product", cascade="all, delete-orphan")
    review_summary = relationship("MarketplaceReviewSummary", back_populates="product", uselist=False, cascade="all, delete-orphan")
    finance_info = relationship("MarketplaceFinanceInformation", back_populates="product", uselist=False, cascade="all, delete-orphan")
    internal_mapping = relationship("MarketplaceInternalMapping", back_populates="marketplace_product", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("provider", "provider_product_id", name="uq_provider_product_id"),
        Index("ix_marketplace_provider_product", "provider", "provider_product_id"),
    )


class MarketplaceProductImage(Base):
    """Authentic external images supplied by the provider."""
    __tablename__ = "marketplace_product_images"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    marketplace_product_id = Column(String(36), ForeignKey("marketplace_products.id", ondelete="CASCADE"), nullable=False, index=True)
    source_url = Column(String(1024), nullable=False)
    image_type = Column(String(32), default="gallery", nullable=False)  # 'primary', 'thumbnail', 'gallery'
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    alt_text = Column(String(255), nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
    fetched_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    product = relationship("MarketplaceProduct", back_populates="images")


class MarketplaceOffer(Base):
    """External offers and deals attached to a marketplace product."""
    __tablename__ = "marketplace_offers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    marketplace_product_id = Column(String(36), ForeignKey("marketplace_products.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_offer_id = Column(String(128), nullable=True)
    seller_name = Column(String(255), nullable=True)
    offer_title = Column(String(255), nullable=False)
    offer_description = Column(Text, nullable=True)
    price_minor = Column(BigInteger, nullable=True)  # in paise
    currency = Column(String(3), default="INR", nullable=False)
    discount_minor = Column(BigInteger, nullable=True)  # in paise
    discount_percentage = Column(Float, nullable=True)
    availability = Column(String(64), nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    source_url = Column(String(1024), nullable=True)
    raw_offer_data = Column(JSON, nullable=False, default=dict)

    product = relationship("MarketplaceProduct", back_populates="offers")


class MarketplaceReviewSummary(Base):
    """Legitimately aggregated ratings and review metrics from provider."""
    __tablename__ = "marketplace_review_summaries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    marketplace_product_id = Column(String(36), ForeignKey("marketplace_products.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    rating = Column(Float, nullable=False)
    review_count = Column(Integer, nullable=False)
    rating_distribution = Column(JSON, nullable=False, default=dict)
    source = Column(String(32), nullable=False)  # 'amazon', 'flipkart'
    fetched_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    product = relationship("MarketplaceProduct", back_populates="review_summary")


class MarketplaceFinanceInformation(Base):
    """EMI and financial payment plans supplied directly by provider."""
    __tablename__ = "marketplace_finance_information"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    marketplace_product_id = Column(String(36), ForeignKey("marketplace_products.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    emi_available = Column(Boolean, default=False, nullable=False)
    emi_provider = Column(String(128), nullable=True)
    emi_summary = Column(Text, nullable=True)
    no_cost_emi_available = Column(Boolean, default=False, nullable=False)
    source_text = Column(Text, nullable=True)
    fetched_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    product = relationship("MarketplaceProduct", back_populates="finance_info")


class MarketplaceFetchLog(Base):
    """Sanitized audit trail for all external marketplace API operations."""
    __tablename__ = "marketplace_fetch_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    provider = Column(String(32), index=True, nullable=False)
    request_type = Column(String(64), nullable=False)  # 'SEARCH', 'GET_ITEM', 'FEED'
    query = Column(String(255), nullable=True)
    status = Column(String(32), nullable=False)  # 'succeeded', 'failed', 'rate_limited', 'unavailable'
    response_code = Column(Integer, nullable=True)
    item_count = Column(Integer, default=0, nullable=False)
    duration_ms = Column(Integer, nullable=True)
    error_code = Column(String(64), nullable=True)
    error_message_sanitized = Column(Text, nullable=True)
    correlation_id = Column(String(64), index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class MarketplaceInternalMapping(Base):
    """
    Commerce Authority Boundary Gate.
    External products CANNOT enter authoritative cart/checkout without a VERIFIED mapping.
    """
    __tablename__ = "marketplace_internal_mappings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    marketplace_product_id = Column(String(36), ForeignKey("marketplace_products.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    marketplace_provider = Column(String(32), index=True, nullable=False)
    internal_product_id = Column(String(36), ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True)
    mapping_status = Column(String(32), default="UNMAPPED", nullable=False)  # 'UNMAPPED', 'CANDIDATE', 'VERIFIED', 'DISABLED', 'PRICE_MISMATCH', 'UNAVAILABLE'
    mapping_confidence = Column(Float, default=0.0, nullable=False)
    mapped_by = Column(String(64), default="system", nullable=False)
    mapped_at = Column(DateTime(timezone=True), nullable=True)
    price_validation_status = Column(String(32), default="pending", nullable=False)  # 'valid', 'mismatch', 'pending'
    inventory_validation_status = Column(String(32), default="pending", nullable=False)  # 'in_stock', 'out_of_stock', 'pending'
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    marketplace_product = relationship("MarketplaceProduct", back_populates="internal_mapping")
    internal_product = relationship("Product")
