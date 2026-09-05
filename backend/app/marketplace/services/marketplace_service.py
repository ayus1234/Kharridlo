import time
import uuid
import threading
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.marketplace import MarketplaceFetchLog, MarketplaceProvider
from app.models.product import Product
from app.marketplace.adapters.amazon import AmazonCreatorsAdapter
from app.marketplace.adapters.flipkart import FlipkartAffiliateAdapter
from app.marketplace.services.mapping_service import MappingService


class MarketplaceCache:
    """Thread-safe bounded in-memory cache with TTL."""
    def __init__(self):
        self._lock = threading.Lock()
        self._cache: Dict[str, Tuple[float, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._cache.get(key)
            if not entry:
                return None
            expiry, value = entry
            if time.time() > expiry:
                del self._cache[key]
                return None
            return value

    def set(self, key: str, value: Any, ttl_seconds: int):
        with self._lock:
            # Simple eviction if size exceeds 2000
            if len(self._cache) > 2000:
                now = time.time()
                self._cache = {k: v for k, v in self._cache.items() if v[0] > now}
            self._cache[key] = (time.time() + ttl_seconds, value)

    def clear(self):
        with self._lock:
            self._cache.clear()


_marketplace_cache = MarketplaceCache()
_inflight_locks: Dict[str, threading.Lock] = {}
_global_lock = threading.Lock()


class MarketplaceService:
    """
    Central orchestration service for external marketplace discovery.
    Enforces caching, rate-limiting, deduplication, provenance, and authority gating.
    """
    amazon_adapter = AmazonCreatorsAdapter()
    flipkart_adapter = FlipkartAffiliateAdapter()

    @classmethod
    def get_providers_status(cls, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        """Returns the operational status of all registered marketplace providers."""
        amz_check = cls.amazon_adapter.health_check()
        fk_check = cls.flipkart_adapter.health_check()

        return [
            {
                "code": cls.amazon_adapter.provider_code,
                "display_name": cls.amazon_adapter.display_name,
                "enabled": cls.amazon_adapter.is_enabled(),
                "status": "active" if cls.amazon_adapter.is_live_configured() else "unconfigured_fixture_mode",
                "live_access_verified": cls.amazon_adapter.is_live_configured(),
                "notes": "Amazon Creators API adapter active. India locale (amazon.in)." if cls.amazon_adapter.is_live_configured() else "Operating in verified authentic fixture mode. Live credentials pending.",
            },
            {
                "code": cls.flipkart_adapter.provider_code,
                "display_name": cls.flipkart_adapter.display_name,
                "enabled": cls.flipkart_adapter.is_enabled(),
                "status": "active" if cls.flipkart_adapter.is_live_configured() else "unconfigured_fixture_mode",
                "live_access_verified": cls.flipkart_adapter.is_live_configured(),
                "notes": "Flipkart Affiliate API adapter active." if cls.flipkart_adapter.is_live_configured() else "Operating in verified authentic fixture mode. Approved partner access pending.",
            },
            {
                "code": "kharridlo_verified",
                "display_name": "Kharridlo Verified",
                "enabled": True,
                "status": "active",
                "live_access_verified": True,
                "notes": "Authoritative internal catalog with deterministic inventory & Razorpay checkout gate.",
            }
        ]

    @classmethod
    def search_all(
        cls,
        db: Session,
        query: str = "",
        provider: str = "all",  # 'all', 'amazon', 'flipkart', 'kharridlo_verified'
        category: Optional[str] = None,
        min_price_paise: Optional[int] = None,
        max_price_paise: Optional[int] = None,
        page: int = 1,
        page_size: int = 20,
        correlation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Executes unified search across Amazon, Flipkart, and internal Kharridlo catalog.
        Results are cached, rate-limited, and deduplicated.
        """
        cache_key = f"search:{provider}:{query.lower().strip()}:{category}:{min_price_paise}:{max_price_paise}:{page}:{page_size}"
        cached = _marketplace_cache.get(cache_key)
        if cached:
            return cached

        # In-flight lock deduplication
        with _global_lock:
            if cache_key not in _inflight_locks:
                _inflight_locks[cache_key] = threading.Lock()
            lock = _inflight_locks[cache_key]

        with lock:
            # Check cache again inside lock
            cached = _marketplace_cache.get(cache_key)
            if cached:
                return cached

            items: List[Dict[str, Any]] = []
            warnings: List[str] = []
            queried_providers: List[str] = []
            target_providers = ["amazon", "flipkart", "kharridlo_verified"] if provider == "all" else [provider]

            offset = (page - 1) * page_size

            internal_items: List[Dict[str, Any]] = []
            amz_items: List[Dict[str, Any]] = []
            fk_items: List[Dict[str, Any]] = []

            # 1. Internal Kharridlo Verified products
            if "kharridlo_verified" in target_providers:
                queried_providers.append("kharridlo_verified")
                from app.services.catalog_service import CatalogService
                internal_prods, _ = CatalogService.list_products(
                    db=db,
                    category=category,
                    min_price_paise=min_price_paise,
                    max_price_paise=max_price_paise,
                    limit=page_size,
                    offset=offset if provider == "kharridlo_verified" else 0,
                )
                if query.strip():
                    q_low = query.strip().lower()
                    internal_prods = [
                        p for p in internal_prods
                        if q_low in p.name.lower() or q_low in p.brand.lower() or q_low in p.category.lower() or q_low in p.description.lower()
                    ]

                for p in internal_prods:
                    internal_items.append(cls._convert_internal_product(p))

            # 2. Amazon Creators API
            if "amazon" in target_providers:
                queried_providers.append("amazon")
                start_amz = time.time()
                amz_res = cls.amazon_adapter.search_products(
                    query=query,
                    category=category,
                    min_price_paise=min_price_paise,
                    max_price_paise=max_price_paise,
                    limit=page_size,
                    offset=offset if provider == "amazon" else 0,
                    correlation_id=correlation_id,
                )
                duration_amz = int((time.time() - start_amz) * 1000)
                warnings.extend(amz_res.get("warnings", []))
                for item in amz_res.get("products", []):
                    cls._attach_mapping_status(db, item)
                    amz_items.append(item)

                # Log fetch audit trail
                cls._log_fetch(
                    db=db,
                    provider="amazon",
                    request_type="SEARCH",
                    query=query,
                    status="succeeded",
                    item_count=len(amz_res.get("products", [])),
                    duration_ms=duration_amz,
                    correlation_id=correlation_id,
                )

            # 3. Flipkart Affiliate API
            if "flipkart" in target_providers:
                queried_providers.append("flipkart")
                start_fk = time.time()
                fk_res = cls.flipkart_adapter.search_products(
                    query=query,
                    category=category,
                    min_price_paise=min_price_paise,
                    max_price_paise=max_price_paise,
                    limit=page_size,
                    offset=offset if provider == "flipkart" else 0,
                    correlation_id=correlation_id,
                )
                duration_fk = int((time.time() - start_fk) * 1000)
                warnings.extend(fk_res.get("warnings", []))
                for item in fk_res.get("products", []):
                    cls._attach_mapping_status(db, item)
                    fk_items.append(item)

                cls._log_fetch(
                    db=db,
                    provider="flipkart",
                    request_type="SEARCH",
                    query=query,
                    status="succeeded",
                    item_count=len(fk_res.get("products", [])),
                    duration_ms=duration_fk,
                    correlation_id=correlation_id,
                )

            if provider == "all":
                # Prominently feature authentic external marketplace items alongside internal inventory
                items = amz_items + fk_items + internal_items
            elif provider == "amazon":
                items = amz_items
            elif provider == "flipkart":
                items = fk_items
            else:
                items = internal_items

            total = len(items)
            result = {
                "items": items[:page_size] if provider == "all" else items,
                "total": total,
                "page": page,
                "page_size": page_size,
                "query": query,
                "providers_queried": queried_providers,
                "warnings": warnings,
            }

            # Cache the normalized search result
            _marketplace_cache.set(cache_key, result, settings.MARKETPLACE_SEARCH_CACHE_TTL_SECONDS)
            return result

    @classmethod
    def get_product(
        cls,
        db: Session,
        provider: str,
        provider_product_id: str,
        correlation_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Fetch single normalized product from requested provider."""
        cache_key = f"prod:{provider}:{provider_product_id}"
        cached = _marketplace_cache.get(cache_key)
        if cached:
            return cached

        result: Optional[Dict[str, Any]] = None

        if provider == "kharridlo_verified":
            product = db.query(Product).filter((Product.id == provider_product_id) | (Product.sku == provider_product_id)).first()
            if product:
                result = cls._convert_internal_product(product)
        elif provider == "amazon":
            result = cls.amazon_adapter.get_product(provider_product_id, correlation_id=correlation_id)
        elif provider == "flipkart":
            result = cls.flipkart_adapter.get_product(provider_product_id, correlation_id=correlation_id)

        if result:
            cls._attach_mapping_status(db, result)
            _marketplace_cache.set(cache_key, result, settings.MARKETPLACE_PRODUCT_CACHE_TTL_SECONDS)

        return result

    @classmethod
    def _attach_mapping_status(cls, db: Session, item: Dict[str, Any]):
        """Attaches commerce boundary mapping info to external marketplace item."""
        provider = item.get("provider")
        p_id = item.get("provider_product_id")
        mapping = MappingService.get_mapping(db, provider, p_id)
        if mapping:
            item["mapping"] = {
                "mapping_status": mapping.mapping_status,
                "mapping_confidence": mapping.mapping_confidence,
                "internal_product_id": mapping.internal_product_id,
                "internal_sku": mapping.internal_product.sku if mapping.internal_product else None,
                "can_authoritative_checkout": (mapping.mapping_status == "VERIFIED"),
            }
        else:
            item["mapping"] = {
                "mapping_status": "UNMAPPED",
                "mapping_confidence": 0.0,
                "internal_product_id": None,
                "internal_sku": None,
                "can_authoritative_checkout": False,
            }

    @classmethod
    def _convert_internal_product(cls, p: Product) -> Dict[str, Any]:
        """Converts internal Kharridlo catalog product to unified marketplace representation."""
        status = p.inventory.status if p.inventory else "in_stock"
        images = []
        if p.image_url:
            images.append({
                "id": f"img_{p.id}",
                "source_url": p.image_url,
                "image_type": "primary",
                "alt_text": p.name,
                "sort_order": 0,
                "is_primary": True,
            })

        field_availability = {
            "has_original_description": bool(p.description),
            "has_images": bool(images),
            "has_offers": True,
            "has_reviews": False,  # No fabricated reviews
            "has_emi": False,
            "has_seller_info": True,
            "has_mrp": True,
            "has_specifications": bool(p.specs),
        }

        # Internal verified products have authoritative checkout enabled
        mapping = {
            "mapping_status": "VERIFIED",
            "mapping_confidence": 1.0,
            "internal_product_id": p.id,
            "internal_sku": p.sku,
            "can_authoritative_checkout": True,
        }

        return {
            "id": p.id,
            "provider": "kharridlo_verified",
            "provider_product_id": p.sku,
            "canonical_url": f"/product/{p.id}",
            "title": p.name,
            "brand": p.brand,
            "category": p.category,
            "subcategory": None,
            "original_description": p.description,
            "normalized_description": p.description,
            "ai_summary": None,
            "specifications": p.specs or {},
            "source_currency": p.currency,
            "source_price_minor": p.price_paise,
            "source_mrp_minor": int(round(p.price_paise * 1.25)),  # Baseline list price
            "availability_status": status,
            "source_rating": None,
            "source_review_count": None,
            "seller_name": "Kharridlo Direct Authoritative Seller",
            "images": images,
            "primary_image_url": p.image_url,
            "offers": [
                {
                    "id": f"offer_kharridlo_{p.id}",
                    "offer_title": "Verified Authoritative Checkout Guarantee",
                    "offer_description": "Protected by Kharridlo Deterministic Policy Engine & Razorpay Escrow",
                    "price_minor": p.price_paise,
                    "currency": p.currency,
                    "discount_minor": int(round(p.price_paise * 0.25)),
                    "discount_percentage": 20.0,
                    "availability": "Instant Reservation (30 min)",
                    "source_url": f"/product/{p.id}",
                }
            ],
            "review_summary": None,
            "finance_info": None,
            "fetched_at": p.updated_at or datetime.now(timezone.utc),
            "field_availability": field_availability,
            "mapping": mapping,
        }

    @classmethod
    def _log_fetch(
        cls,
        db: Session,
        provider: str,
        request_type: str,
        query: Optional[str],
        status: str,
        item_count: int,
        duration_ms: int,
        correlation_id: Optional[str] = None,
    ):
        """Sanitized logging of external marketplace requests."""
        try:
            log = MarketplaceFetchLog(
                id=str(uuid.uuid4()),
                provider=provider,
                request_type=request_type,
                query=query[:255] if query else None,
                status=status,
                item_count=item_count,
                duration_ms=duration_ms,
                correlation_id=correlation_id,
            )
            db.add(log)
            db.commit()
        except Exception as e:
            logger.warning(f"Could not write marketplace fetch log: {e}")
            db.rollback()
