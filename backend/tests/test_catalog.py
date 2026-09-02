import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_products_default():
    """Verify default product listing returns paginated items and total count."""
    response = client.get("/api/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] == 84
    assert len(data["items"]) <= 20
    assert data["limit"] == 20
    assert data["offset"] == 0


def test_list_products_category_filter():
    """Verify filtering by category (e.g. laptop)."""
    response = client.get("/api/v1/products?category=laptop")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 20
    for item in data["items"]:
        assert item["category"].lower() == "laptop"


def test_list_products_price_filter():
    """Verify filtering by min and max price in INR."""
    response = client.get("/api/v1/products?min_price_inr=60000&max_price_inr=70000")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    for item in data["items"]:
        assert 60000 <= item["price_inr"] <= 70000
        assert 6000000 <= item["price_paise"] <= 7000000


def test_financial_precision_paise():
    """Verify price is stored in integer paise and converted accurately to INR."""
    response = client.get("/api/v1/products/prod_lp15_01")
    assert response.status_code == 200
    product = response.json()
    assert product["name"] == "TechNova Laptop Pro 15"
    assert product["price_paise"] == 6499900
    assert product["price_inr"] == 64999.0
    assert isinstance(product["price_paise"], int)


def test_get_product_detail_success():
    """Verify detailed product retrieval including specs and inventory."""
    response = client.get("/api/v1/products/prod_mouse_01")
    assert response.status_code == 200
    product = response.json()
    assert product["sku"] == "DK-MS-01"
    assert product["name"] == "TechNova Precision Wireless Mouse"
    assert product["category"] == "mouse"
    assert product["price_paise"] == 149900
    assert product["price_inr"] == 1499.0
    assert "sensor" in product["specs"]
    assert product["inventory"] is not None
    assert product["inventory"]["status"] == "in_stock"


def test_get_product_not_found():
    """Verify 404 response for invalid product IDs."""
    response = client.get("/api/v1/products/non_existent_sku_9999")
    assert response.status_code == 404
    error = response.json()
    assert "not found" in error["detail"].lower()


def test_product_search():
    """Verify deterministic search across product name and category."""
    response = client.get("/api/v1/products/search?q=Developer")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    for item in data["items"]:
        searchable_text = f"{item['name']} {item['description']} {item['category']} {item['brand']}".lower()
        assert "developer" in searchable_text


def test_out_of_stock_scenario():
    """Verify deterministic out-of-stock representation for failure recovery demos."""
    response = client.get("/api/v1/products/prod_lp14_oos/inventory")
    assert response.status_code == 200
    inventory = response.json()
    assert inventory["product_id"] == "prod_lp14_oos"
    assert inventory["available_quantity"] == 0
    assert inventory["status"] == "out_of_stock"

    # Also verify availability_status on product details
    prod_resp = client.get("/api/v1/products/prod_lp14_oos")
    assert prod_resp.status_code == 200
    assert prod_resp.json()["availability_status"] == "out_of_stock"


def test_low_stock_scenario():
    """Verify deterministic low-stock representation."""
    response = client.get("/api/v1/products/prod_lp_low_01/inventory")
    assert response.status_code == 200
    inventory = response.json()
    assert inventory["available_quantity"] <= 5
    assert inventory["status"] == "low_stock"
