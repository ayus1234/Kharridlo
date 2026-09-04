import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.marketplace.adapters.amazon import AmazonCreatorsAdapter
from app.marketplace.adapters.flipkart import FlipkartAffiliateAdapter
from app.marketplace.services.marketplace_service import MarketplaceService, _marketplace_cache
from app.marketplace.services.mapping_service import MappingService
from app.models.marketplace import MarketplaceInternalMapping
from app.models.product import Product

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_cache():
    """Clear marketplace in-memory cache before every test."""
    _marketplace_cache.clear()


def test_amazon_adapter_normalization_contract():
    """Verify Amazon Creators API normalization captures genuine fields with honest provenance."""
    adapter = AmazonCreatorsAdapter()
    res = adapter.search_products(query="Lenovo", limit=5)
    assert res["provider"] == "amazon"
    assert len(res["products"]) >= 1

    item = res["products"][0]
    assert item["provider"] == "amazon"
    assert item["provider_product_id"] == "B0BT9SCV9B"
    assert "Lenovo" in item["title"]
    assert item["brand"] == "Lenovo"
    assert item["category"] == "Electronics"
    assert item["source_currency"] == "INR"
    assert item["source_price_minor"] == 3499000  # ₹34,990 in paise
    assert item["source_mrp_minor"] == 5299000    # ₹52,990 in paise
    assert item["availability_status"] == "in_stock"
    assert item["seller_name"] == "Appario Retail Private Ltd"
    assert len(item["images"]) >= 1
    assert item["primary_image_url"] is not None

    # Provenance honesty check: no fabricated reviews or EMI
    fa = item["field_availability"]
    assert fa["has_original_description"] is True
    assert fa["has_images"] is True
    assert fa["has_offers"] is True
    assert fa["has_reviews"] is False  # Zero fabricated reviews
    assert fa["has_emi"] is False      # Zero fabricated EMI


def test_flipkart_adapter_normalization_contract():
    """Verify Flipkart Affiliate API normalization captures genuine fields and offers."""
    adapter = FlipkartAffiliateAdapter()
    res = adapter.search_products(query="ASUS", limit=5)
    assert res["provider"] == "flipkart"
    assert len(res["products"]) >= 1

    item = res["products"][0]
    assert item["provider"] == "flipkart"
    assert item["provider_product_id"] == "COMGZFH6ZG8VPHGZ"
    assert "ASUS Vivobook" in item["title"]
    assert item["brand"] == "ASUS"
    assert item["source_currency"] == "INR"
    assert item["source_price_minor"] == 4299000  # ₹42,990 in paise
    assert item["source_mrp_minor"] == 6299000    # ₹62,990 in paise
    assert item["availability_status"] == "in_stock"
    assert item["seller_name"] == "IndiFlashMart"
    assert len(item["offers"]) >= 1
    assert "5% Cashback" in item["offers"][0]["offer_title"]

    fa = item["field_availability"]
    assert fa["has_reviews"] is False
    assert fa["has_emi"] is False


def test_marketplace_unified_search_api():
    """Test GET /api/v1/marketplace/search combines providers with provenance badges."""
    response = client.get("/api/v1/marketplace/search?q=laptop&provider=all")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] >= 1
    assert "providers_queried" in data
    assert "amazon" in data["providers_queried"]
    assert "flipkart" in data["providers_queried"]
    assert "kharridlo_verified" in data["providers_queried"]

    # Verify at least one item has INR pricing and images
    first_item = data["items"][0]
    assert "id" in first_item
    assert "provider" in first_item
    assert "title" in first_item
    assert "source_price_inr" in first_item
    assert "field_availability" in first_item


def test_marketplace_search_provider_filter():
    """Test filtering by specific provider."""
    res_amz = client.get("/api/v1/marketplace/search?provider=amazon")
    assert res_amz.status_code == 200
    for item in res_amz.json()["items"]:
        assert item["provider"] == "amazon"

    res_fk = client.get("/api/v1/marketplace/search?provider=flipkart")
    assert res_fk.status_code == 200
    for item in res_fk.json()["items"]:
        assert item["provider"] == "flipkart"


def test_marketplace_product_lookup_api():
    """Test GET /api/v1/marketplace/products/{provider}/{id} endpoint."""
    res = client.get("/api/v1/marketplace/products/amazon/B0BT9SCV9B")
    assert res.status_code == 200
    item = res.json()
    assert item["provider"] == "amazon"
    assert item["provider_product_id"] == "B0BT9SCV9B"
    assert item["source_price_inr"] == 34990.0
    assert item["mapping"]["mapping_status"] == "UNMAPPED"
    assert item["mapping"]["can_authoritative_checkout"] is False

    # Not found case
    not_found = client.get("/api/v1/marketplace/products/amazon/NON_EXISTENT_ASIN")
    assert not_found.status_code == 404


def test_marketplace_providers_status_endpoint():
    """Test GET /api/v1/marketplace/providers."""
    res = client.get("/api/v1/marketplace/providers")
    assert res.status_code == 200
    providers = res.json()
    codes = [p["code"] for p in providers]
    assert "amazon" in codes
    assert "flipkart" in codes
    assert "kharridlo_verified" in codes


def test_commerce_authority_boundary():
    """
    CRITICAL TEST: Verify external marketplace products cannot bypass Kharridlo's
    deterministic commerce authority, cart, or inventory.
    """
    test_session = f"sess_bound_{uuid.uuid4().hex[:8]}"

    # 1. Inspect unmapped marketplace item mapping
    mapping_res = client.get("/api/v1/marketplace/mappings/amazon/B0BT9SCV9B")
    assert mapping_res.status_code == 200
    assert mapping_res.json()["mapping_status"] == "UNMAPPED"
    assert mapping_res.json()["can_authoritative_checkout"] is False

    # 2. Attempting to add an unmapped external ASIN to authoritative cart MUST be rejected
    add_attempt = client.post(
        f"/api/v1/cart/{test_session}/items",
        json={"product_id": "amz_B0BT9SCV9B", "quantity": 1}
    )
    assert add_attempt.status_code == 404
    assert add_attempt.json()["detail"]["code"] == "PRODUCT_NOT_FOUND"

    # 3. Verified internal product CAN enter cart and checkout
    valid_add = client.post(
        f"/api/v1/cart/{test_session}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1}
    )
    assert valid_add.status_code == 200
    assert len(valid_add.json()["items"]) == 1

    # Clean up test session
    client.delete(f"/api/v1/cart/{test_session}")
