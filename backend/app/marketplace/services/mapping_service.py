import uuid
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.marketplace import MarketplaceInternalMapping
from app.models.product import Product


class MappingService:
    """
    Critical Commerce Authority Boundary Service.
    Determines whether an external marketplace product has a verified internal mapping.
    Only 'VERIFIED' mappings may enter the authoritative cart, policy, and Razorpay gate.
    """

    @classmethod
    def get_mapping(
        cls,
        db: Session,
        provider: str,
        provider_product_id: str,
    ) -> Optional[MarketplaceInternalMapping]:
        return (
            db.query(MarketplaceInternalMapping)
            .filter(
                MarketplaceInternalMapping.marketplace_provider == provider,
                MarketplaceInternalMapping.marketplace_product_id == provider_product_id,
            )
            .first()
        )

    @classmethod
    def get_or_create_unmapped(
        cls,
        db: Session,
        marketplace_product_id: str,
        provider: str,
    ) -> MarketplaceInternalMapping:
        """Fetch or create default UNMAPPED record preserving the boundary."""
        mapping = cls.get_mapping(db, provider, marketplace_product_id)
        if not mapping:
            mapping = MarketplaceInternalMapping(
                id=str(uuid.uuid4()),
                marketplace_product_id=marketplace_product_id,
                marketplace_provider=provider,
                mapping_status="UNMAPPED",
                mapping_confidence=0.0,
                price_validation_status="pending",
                inventory_validation_status="pending",
            )
            db.add(mapping)
            db.commit()
            db.refresh(mapping)
        return mapping

    @classmethod
    def can_checkout(
        cls,
        db: Session,
        provider: str,
        provider_product_id: str,
    ) -> bool:
        """Strict check: external item cannot check out unless mapped and VERIFIED."""
        mapping = cls.get_mapping(db, provider, provider_product_id)
        if not mapping:
            return False
        return mapping.mapping_status == "VERIFIED" and mapping.internal_product_id is not None
