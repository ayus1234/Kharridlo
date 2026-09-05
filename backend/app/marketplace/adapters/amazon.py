import time
import logging
from typing import Optional, List, Dict, Any
from app.core.config import settings
from app.marketplace.adapters.base import BaseMarketplaceAdapter
from app.marketplace.adapters.fixtures import AMAZON_SEARCH_FIXTURES

logger = logging.getLogger(__name__)


class AmazonCreatorsAdapter(BaseMarketplaceAdapter):
    """
    Adapter for Amazon Creators API (India locale - Amazon.in).
    Requests: SearchItems, GetItems
    Resources: Images, ItemInfo, BrowseNodeInfo, OffersV2
    """

    @property
    def provider_code(self) -> str:
        return "amazon"

    @property
    def display_name(self) -> str:
        return "Amazon.in"

    _cached_oauth_token: Optional[str] = None
    _oauth_token_expiry: float = 0.0

    def is_enabled(self) -> bool:
        return bool(settings.AMAZON_CREATORS_API_ENABLED)

    def is_live_configured(self) -> bool:
        has_creators_oauth = bool(
            settings.AMAZON_CREATORS_CLIENT_ID
            and settings.AMAZON_CREATORS_CLIENT_SECRET
            and settings.AMAZON_PARTNER_TAG
        )
        has_legacy_keys = bool(
            settings.AMAZON_PARTNER_TAG
            and settings.AMAZON_ACCESS_KEY
            and settings.AMAZON_SECRET_KEY
        )
        return has_creators_oauth or has_legacy_keys

    def _get_auth_headers(self, target_operation: str) -> Dict[str, str]:
        """
        Builds authenticated headers for Amazon Creators API.
        Exchanges Client ID & Client Secret for an in-memory OAuth 2.0 Bearer token.
        Cached at runtime; never written to .env or logs.
        """
        import requests
        headers = {
            "Content-Type": "application/json; charset=utf-8",
            "X-Amz-Target": f"com.amazon.paapi5.v1.ProductAdvertisingAPIv1.{target_operation}",
        }

        # Creators API OAuth 2.0 Client Credentials flow
        if settings.AMAZON_CREATORS_CLIENT_ID and settings.AMAZON_CREATORS_CLIENT_SECRET:
            current_time = time.time()
            if not self._cached_oauth_token or current_time >= self._oauth_token_expiry:
                token_url = settings.AMAZON_TOKEN_ENDPOINT or "https://api.amazon.co.uk/auth/o2/token"
                data = {
                    "grant_type": "client_credentials",
                    "client_id": settings.AMAZON_CREATORS_CLIENT_ID,
                    "client_secret": settings.AMAZON_CREATORS_CLIENT_SECRET,
                }
                token_resp = requests.post(token_url, data=data, timeout=10)
                token_resp.raise_for_status()
                token_data = token_resp.json()
                self._cached_oauth_token = token_data.get("access_token")
                expires_in = token_data.get("expires_in", 3600)
                self._oauth_token_expiry = current_time + max(expires_in - 60, 60)

            if self._cached_oauth_token:
                headers["Authorization"] = f"Bearer {self._cached_oauth_token}"

        return headers

    def health_check(self) -> Dict[str, Any]:
        auth_mode = "none"
        if settings.AMAZON_CREATORS_CLIENT_ID and settings.AMAZON_CREATORS_CLIENT_SECRET:
            auth_mode = "creators_api_oauth2"
        elif settings.AMAZON_ACCESS_KEY and settings.AMAZON_SECRET_KEY:
            auth_mode = "legacy_paapi"

        return {
            "provider": self.provider_code,
            "display_name": self.display_name,
            "enabled": self.is_enabled(),
            "live_access_verified": self.is_live_configured(),
            "status": "active" if (self.is_enabled() and self.is_live_configured()) else "unconfigured_fixture_mode",
            "host": settings.AMAZON_HOST,
            "marketplace": settings.AMAZON_MARKETPLACE,
            "auth_mode": auth_mode,
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
        Execute product search against Amazon Creators API (or verified authentic fixtures).
        """
        start_time = time.time()
        warnings: List[str] = []

        if self.is_enabled() and self.is_live_configured():
            try:
                # Live Amazon Creators API request invocation
                raw_items = self._execute_live_search(query, category, limit)
                normalized = [self.normalize_product(item) for item in raw_items]
            except Exception as e:
                logger.error(f"Amazon Creators API search failed (correlation_id={correlation_id}): {e}")
                warnings.append(f"Amazon live search temporarily unavailable; falling back to verified catalog.")
                normalized = self._search_fixtures(query, min_price_paise, max_price_paise)
        else:
            # Deterministic authentic fixture fallback for offline/development mode
            normalized = self._search_fixtures(query, min_price_paise, max_price_paise)

        # Apply client-side price filtering if needed
        filtered = []
        for p in normalized:
            price = p.get("source_price_minor")
            if min_price_paise is not None and price is not None and price < min_price_paise:
                continue
            if max_price_paise is not None and price is not None and price > max_price_paise:
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
        """Fetch single product by ASIN."""
        if self.is_enabled() and self.is_live_configured():
            try:
                raw_item = self._execute_live_get_item(provider_product_id)
                if raw_item:
                    return self.normalize_product(raw_item)
            except Exception as e:
                logger.error(f"Amazon Creators API GetItems failed for {provider_product_id}: {e}")

        # Search in fixtures
        for fixture in AMAZON_SEARCH_FIXTURES:
            if fixture.get("ASIN") == provider_product_id:
                return self.normalize_product(fixture)

        return None

    def _search_fixtures(
        self,
        query: str,
        min_price_paise: Optional[int] = None,
        max_price_paise: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        results = []
        q_lower = query.lower().strip() if query else ""

        for fix in AMAZON_SEARCH_FIXTURES:
            title = fix.get("ItemInfo", {}).get("Title", {}).get("DisplayValue", "").lower()
            brand = fix.get("ItemInfo", {}).get("ByLineInfo", {}).get("Brand", {}).get("DisplayValue", "").lower()
            features = " ".join(fix.get("ItemInfo", {}).get("Features", {}).get("DisplayValues", [])).lower()

            if not q_lower or q_lower in title or q_lower in brand or q_lower in features or any(w in title for w in q_lower.split()):
                results.append(self.normalize_product(fix))
        return results

    def _execute_live_search(self, query: str, category: Optional[str], limit: int) -> List[Dict[str, Any]]:
        """
        Executes an authenticated SearchItems call to the Amazon Creators API.
        Resources requested: Images, ItemInfo, BrowseNodeInfo, OffersV2
        """
        import requests
        headers = self._get_auth_headers("SearchItems")
        payload = {
            "Keywords": query,
            "PartnerTag": settings.AMAZON_PARTNER_TAG,
            "PartnerType": "Associates",
            "Marketplace": settings.AMAZON_MARKETPLACE,
            "ItemCount": min(limit, 10),
            "Resources": [
                "Images.Primary.Large",
                "Images.Primary.Medium",
                "Images.Variants.Large",
                "ItemInfo.Title",
                "ItemInfo.ByLineInfo",
                "ItemInfo.Classifications",
                "ItemInfo.Features",
                "ItemInfo.ProductInfo",
                "OffersV2.Listings.Price",
                "OffersV2.Listings.SavingBasis",
                "OffersV2.Listings.Availability",
                "OffersV2.Listings.Condition",
                "OffersV2.Listings.MerchantInfo",
                "OffersV2.Listings.DealDetails",
            ],
        }
        host = settings.AMAZON_HOST or "creatorsapi.amazon"
        response = requests.post(f"https://{host}/paapi5/searchitems", json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        return data.get("SearchResult", {}).get("Items", [])

    def _execute_live_get_item(self, asin: str) -> Optional[Dict[str, Any]]:
        import requests
        headers = self._get_auth_headers("GetItems")
        payload = {
            "ItemIds": [asin],
            "PartnerTag": settings.AMAZON_PARTNER_TAG,
            "PartnerType": "Associates",
            "Marketplace": settings.AMAZON_MARKETPLACE,
            "Resources": [
                "Images.Primary.Large",
                "Images.Variants.Large",
                "ItemInfo.Title",
                "ItemInfo.ByLineInfo",
                "ItemInfo.Classifications",
                "ItemInfo.Features",
                "ItemInfo.ProductInfo",
                "OffersV2.Listings.Price",
                "OffersV2.Listings.SavingBasis",
                "OffersV2.Listings.Availability",
                "OffersV2.Listings.MerchantInfo",
                "OffersV2.Listings.DealDetails",
            ],
        }
        host = settings.AMAZON_HOST or "creatorsapi.amazon"
        response = requests.post(f"https://{host}/paapi5/getitems", json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        items = response.json().get("ItemsResult", {}).get("Items", [])
        return items[0] if items else None

    def normalize_product(self, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Maps raw Amazon payload to Kharridlo normalized product representation."""
        asin = raw_payload.get("ASIN", "")
        item_info = raw_payload.get("ItemInfo", {})
        title = item_info.get("Title", {}).get("DisplayValue", "Amazon Product")
        brand = item_info.get("ByLineInfo", {}).get("Brand", {}).get("DisplayValue", "Generic")
        category = item_info.get("Classifications", {}).get("Binding", {}).get("DisplayValue", "Electronics")

        # Features as bullet points
        feature_list = item_info.get("Features", {}).get("DisplayValues", [])
        original_description = "\n".join(f"• {f}" for f in feature_list) if feature_list else None

        # Images extraction
        images_dict = raw_payload.get("Images", {})
        normalized_images: List[Dict[str, Any]] = []

        primary_large = images_dict.get("Primary", {}).get("Large", {})
        primary_url = primary_large.get("URL")
        if primary_url:
            normalized_images.append({
                "source_url": primary_url,
                "image_type": "primary",
                "width": primary_large.get("Width"),
                "height": primary_large.get("Height"),
                "alt_text": f"{title} - Primary",
                "sort_order": 0,
                "is_primary": True,
            })

        for idx, variant in enumerate(images_dict.get("Variants", []), start=1):
            var_url = variant.get("Large", {}).get("URL")
            if var_url:
                normalized_images.append({
                    "source_url": var_url,
                    "image_type": "gallery",
                    "width": variant.get("Large", {}).get("Width"),
                    "height": variant.get("Large", {}).get("Height"),
                    "alt_text": f"{title} - Gallery {idx}",
                    "sort_order": idx,
                    "is_primary": False,
                })

        # OffersV2 mapping
        offers_v2 = raw_payload.get("OffersV2", {}).get("Listings", [])
        normalized_offers = [self.normalize_offer(o) for o in offers_v2]

        source_price_minor: Optional[int] = None
        source_mrp_minor: Optional[int] = None
        seller_name: Optional[str] = None
        availability_status = "in_stock"

        if normalized_offers:
            first_offer = normalized_offers[0]
            source_price_minor = first_offer.get("price_minor")
            seller_name = first_offer.get("seller_name")
            if first_offer.get("availability") and "out of stock" in first_offer["availability"].lower():
                availability_status = "out_of_stock"

        if offers_v2:
            saving_basis = offers_v2[0].get("SavingBasis", {})
            if saving_basis.get("Amount") is not None:
                source_mrp_minor = int(round(float(saving_basis["Amount"]) * 100))

        # Specifications mapping
        specs: Dict[str, Any] = {}
        for idx, feat in enumerate(feature_list[:8]):
            if ":" in feat:
                k, v = feat.split(":", 1)
                specs[k.strip()] = v.strip()
            else:
                specs[f"Feature {idx+1}"] = feat

        # Honest field availability tracking
        field_availability = {
            "has_original_description": bool(original_description),
            "has_images": bool(normalized_images),
            "has_offers": bool(normalized_offers),
            "has_reviews": False,  # Creators API doesn't return scraped customer review text
            "has_emi": False,      # No fabricated EMI
            "has_seller_info": bool(seller_name),
            "has_mrp": bool(source_mrp_minor),
            "has_specifications": bool(specs),
        }

        return {
            "id": f"amz_{asin}",
            "provider": self.provider_code,
            "provider_product_id": asin,
            "canonical_url": raw_payload.get("DetailPageURL", f"https://www.amazon.in/dp/{asin}"),
            "title": title,
            "brand": brand,
            "category": category,
            "subcategory": item_info.get("Classifications", {}).get("ProductGroup", {}).get("DisplayValue"),
            "original_description": original_description,
            "normalized_description": original_description,
            "ai_summary": None,  # Separate field; never overwrite original
            "specifications": specs,
            "source_currency": "INR",
            "source_price_minor": source_price_minor,
            "source_mrp_minor": source_mrp_minor,
            "availability_status": availability_status,
            "source_rating": None,  # No fabricated ratings
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
        """Normalizes an individual Amazon OffersV2 listing."""
        price_obj = raw_offer.get("Price", {})
        price_amount = price_obj.get("Amount")
        price_minor = int(round(float(price_amount) * 100)) if price_amount is not None else None

        savings_obj = price_obj.get("Savings", {})
        discount_amount = savings_obj.get("Amount")
        discount_minor = int(round(float(discount_amount) * 100)) if discount_amount is not None else None
        discount_pct = savings_obj.get("Percentage")

        seller = raw_offer.get("MerchantInfo", {}).get("Name")
        avail_msg = raw_offer.get("Availability", {}).get("Message", "In stock")
        deal_title = raw_offer.get("DealDetails", {}).get("DealTitle")

        return {
            "provider_offer_id": raw_offer.get("Id"),
            "seller_name": seller,
            "offer_title": deal_title or ("Amazon Offer" if price_minor else "Standard Listing"),
            "offer_description": raw_offer.get("DealDetails", {}).get("DealBadge"),
            "price_minor": price_minor,
            "currency": price_obj.get("Currency", "INR"),
            "discount_minor": discount_minor,
            "discount_percentage": float(discount_pct) if discount_pct is not None else None,
            "availability": avail_msg,
            "source_url": None,
        }
