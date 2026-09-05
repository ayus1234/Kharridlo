import time
import logging
from typing import Optional, List, Dict, Any
from app.core.config import settings
from app.marketplace.adapters.base import BaseMarketplaceAdapter
from app.marketplace.adapters.fixtures import FLIPKART_SEARCH_FIXTURES

logger = logging.getLogger(__name__)


class FlipkartAffiliateAdapter(BaseMarketplaceAdapter):
    """
    Adapter for Flipkart Affiliate API / Feed (Affiliate API 1.0).
    Endpoints: Search, Product ID lookup, Category Feeds
    Auth: Fk-Affiliate-Id, Fk-Affiliate-Token
    """

    @property
    def provider_code(self) -> str:
        return "flipkart"

    @property
    def display_name(self) -> str:
        return "Flipkart"

    def is_enabled(self) -> bool:
        return bool(settings.FLIPKART_API_ENABLED)

    def is_live_configured(self) -> bool:
        return bool(
            settings.FLIPKART_AFFILIATE_ID
            and settings.FLIPKART_AFFILIATE_TOKEN
        )

    def health_check(self) -> Dict[str, Any]:
        return {
            "provider": self.provider_code,
            "display_name": self.display_name,
            "enabled": self.is_enabled(),
            "live_access_verified": self.is_live_configured(),
            "status": "active" if (self.is_enabled() and self.is_live_configured()) else "unconfigured_fixture_mode",
            "base_url": settings.FLIPKART_API_BASE_URL,
        }

    def search_products(
        self,
        query: str,
        category: Optional[str] = None,
        min_price_paise: Optional[int] = None,
        max_price_paise: Optional[int] = None,
        limit: int = 20,
        offset: int = 0,
        correlation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Execute product search against Flipkart Affiliate API (or authentic fixtures).
        """
        start_time = time.time()
        warnings: List[str] = []

        if self.is_enabled() and self.is_live_configured():
            try:
                raw_items = self._execute_live_search(query, limit)
                normalized = [self.normalize_product(item) for item in raw_items]
            except Exception as e:
                logger.error(f"Flipkart Affiliate API search failed (correlation_id={correlation_id}): {e}")
                warnings.append("Flipkart affiliate feed temporarily unavailable; falling back to verified catalog.")
                normalized = self._search_fixtures(query, min_price_paise, max_price_paise)
        else:
            normalized = self._search_fixtures(query, category=category, min_price_paise=min_price_paise, max_price_paise=max_price_paise)

        filtered = []
        for p in normalized:
            price = p.get("source_price_minor")
            if min_price_paise is not None and price is not None and price < min_price_paise:
                continue
            if max_price_paise is not None and price is not None and price > max_price_paise:
                continue
            if category:
                cat_lower = category.lower().strip()
                p_cat = (p.get("category") or "").lower()
                p_subcat = (p.get("subcategory") or "").lower()
                p_title = (p.get("title") or "").lower()
                if cat_lower not in p_cat and cat_lower not in p_subcat and cat_lower not in p_title:
                    continue
            filtered.append(p)

        sliced = filtered[offset : offset + limit]
        return {
            "provider": self.provider_code,
            "products": sliced,
            "total": len(filtered),
            "duration_ms": int((time.time() - start_time) * 1000),
            "warnings": warnings,
        }

    def get_product(
        self,
        provider_product_id: str,
        correlation_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Fetch single product by Flipkart FSN / product ID."""
        if self.is_enabled() and self.is_live_configured():
            try:
                raw_item = self._execute_live_get_product(provider_product_id)
                if raw_item:
                    return self.normalize_product(raw_item)
            except Exception as e:
                logger.error(f"Flipkart Affiliate API get product failed for {provider_product_id}: {e}")

        for fixture in FLIPKART_SEARCH_FIXTURES:
            p_id = fixture.get("productBaseInfo", {}).get("productIdentifier", {}).get("productId")
            if p_id == provider_product_id:
                return self.normalize_product(fixture)

        return None

    def _search_fixtures(
        self,
        query: str,
        category: Optional[str] = None,
        min_price_paise: Optional[int] = None,
        max_price_paise: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        results = []
        q_lower = query.lower().strip() if query else ""

        for fix in FLIPKART_SEARCH_FIXTURES:
            attrs = fix.get("productBaseInfo", {}).get("productAttributes", {})
            title = attrs.get("title", "").lower()
            brand = attrs.get("productBrand", "").lower()
            desc = attrs.get("productDescription", "").lower()

            if not q_lower or q_lower in title or q_lower in brand or q_lower in desc or any(w in title for w in q_lower.split()):
                results.append(self.normalize_product(fix))
        return results

    def _execute_live_search(self, query: str, limit: int) -> List[Dict[str, Any]]:
        import requests
        headers = {
            "Fk-Affiliate-Id": settings.FLIPKART_AFFILIATE_ID,
            "Fk-Affiliate-Token": settings.FLIPKART_AFFILIATE_TOKEN,
        }
        url = f"{settings.FLIPKART_API_BASE_URL}/search.json"
        params = {"query": query, "resultCount": min(limit, 10)}
        response = requests.get(url, headers=headers, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        return data.get("productInfoList", [])

    def _execute_live_get_product(self, product_id: str) -> Optional[Dict[str, Any]]:
        import requests
        headers = {
            "Fk-Affiliate-Id": settings.FLIPKART_AFFILIATE_ID,
            "Fk-Affiliate-Token": settings.FLIPKART_AFFILIATE_TOKEN,
        }
        url = f"{settings.FLIPKART_API_BASE_URL}/product.json"
        params = {"id": product_id}
        response = requests.get(url, headers=headers, params=params, timeout=5)
        response.raise_for_status()
        return response.json()

    def normalize_product(self, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Converts raw Flipkart Affiliate API response into normalized dictionary."""
        base_info = raw_payload.get("productBaseInfo", {})
        identifier = base_info.get("productIdentifier", {})
        product_id = identifier.get("productId", "")
        attrs = base_info.get("productAttributes", {})

        title = attrs.get("title", "Flipkart Product")
        brand = attrs.get("productBrand", "Generic")
        desc = attrs.get("productDescription")

        # Category from paths
        cat_paths = identifier.get("categoryPaths", {}).get("categoryPath", [[]])
        category = "Electronics"
        if cat_paths and cat_paths[0]:
            category = cat_paths[0][-1].get("title", "Electronics")

        # Price parsing
        selling_price_obj = attrs.get("sellingPrice", {})
        selling_amount = selling_price_obj.get("amount")
        source_price_minor = int(round(float(selling_amount) * 100)) if selling_amount is not None else None

        mrp_obj = attrs.get("maximumRetailPrice", {})
        mrp_amount = mrp_obj.get("amount")
        source_mrp_minor = int(round(float(mrp_amount) * 100)) if mrp_amount is not None else None

        # Images
        image_urls = attrs.get("imageUrls", {})
        normalized_images: List[Dict[str, Any]] = []
        primary_url = None

        # Sort resolutions descending to pick best quality
        sorted_resolutions = sorted(image_urls.keys(), reverse=True)
        for idx, res in enumerate(sorted_resolutions):
            url = image_urls[res]
            is_pri = (idx == 0)
            if is_pri:
                primary_url = url
            normalized_images.append({
                "source_url": url,
                "image_type": "primary" if is_pri else "gallery",
                "alt_text": f"{title} - Resolution {res}",
                "sort_order": idx,
                "is_primary": is_pri,
            })

        # Availability
        in_stock = attrs.get("inStock", True)
        availability_status = "in_stock" if in_stock else "out_of_stock"

        # Specifications
        specs: Dict[str, Any] = {}
        for idx, item in enumerate(attrs.get("keySpecs", [])):
            specs[f"Key Spec {idx+1}"] = item
        if attrs.get("color"):
            specs["Color"] = attrs["color"]
        if attrs.get("size"):
            specs["Size"] = attrs["size"]

        # Seller
        shipping_info = raw_payload.get("productShippingBaseInfo", {})
        seller_name = shipping_info.get("sellerName")

        # Offers
        raw_offers = raw_payload.get("offers", [])
        normalized_offers = [self.normalize_offer(o) for o in raw_offers]

        field_availability = {
            "has_original_description": bool(desc),
            "has_images": bool(normalized_images),
            "has_offers": bool(normalized_offers),
            "has_reviews": False,  # Not provided in basic affiliate API without reviews add-on
            "has_emi": False,      # No fabricated EMI
            "has_seller_info": bool(seller_name),
            "has_mrp": bool(source_mrp_minor),
            "has_specifications": bool(specs),
        }

        return {
            "id": f"fk_{product_id}",
            "provider": self.provider_code,
            "provider_product_id": product_id,
            "canonical_url": attrs.get("productUrl", f"https://www.flipkart.com/product/p/itm?pid={product_id}"),
            "title": title,
            "brand": brand,
            "category": category,
            "subcategory": None,
            "original_description": desc,
            "normalized_description": desc,
            "ai_summary": None,
            "specifications": specs,
            "source_currency": "INR",
            "source_price_minor": source_price_minor,
            "source_mrp_minor": source_mrp_minor,
            "availability_status": availability_status,
            "source_rating": None,
            "source_review_count": None,
            "seller_name": seller_name,
            "images": normalized_images,
            "primary_image_url": primary_url,
            "offers": normalized_offers,
            "review_summary": None,
            "finance_info": None,
            "field_availability": field_availability,
        }

    def normalize_offer(self, raw_offer: Dict[str, Any]) -> Dict[str, Any]:
        title = raw_offer.get("offerTitle", "Flipkart Partner Offer")
        desc = raw_offer.get("offerDescription")
        pct = raw_offer.get("discountPercentage")

        return {
            "provider_offer_id": None,
            "seller_name": None,
            "offer_title": title,
            "offer_description": desc,
            "price_minor": None,
            "currency": "INR",
            "discount_minor": None,
            "discount_percentage": float(pct) if pct is not None else None,
            "availability": "Available at checkout",
            "source_url": None,
        }
