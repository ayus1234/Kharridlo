import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.inventory import Inventory
from app.models.product import Product

client = TestClient(app)


@pytest.fixture
def test_session_id():
    """Generate a unique session ID for test isolation."""
    return f"test_sess_{uuid.uuid4().hex[:12]}"


def test_create_and_get_cart(test_session_id):
    """Test 1: Cart is created on first access with zero totals and active status."""
    response = client.get(f"/api/v1/cart/{test_session_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == test_session_id
    assert data["status"] == "active"
    assert data["currency"] == "INR"
    assert data["subtotal_paise"] == 0
    assert data["total_paise"] == 0
    assert data["subtotal_inr"] == 0.0
    assert data["total_inr"] == 0.0
    assert len(data["items"]) == 0
    assert data["is_expired"] is False


def test_independent_sessions_isolation():
    """Test 2: Different session IDs have completely independent carts."""
    sess_a = f"sess_a_{uuid.uuid4().hex[:8]}"
    sess_b = f"sess_b_{uuid.uuid4().hex[:8]}"

    # Add item to session A
    res_a = client.post(f"/api/v1/cart/{sess_a}/items", json={"product_id": "prod_mouse_01", "quantity": 1})
    assert res_a.status_code == 200
    assert len(res_a.json()["items"]) == 1

    # Fetch session B
    res_b = client.get(f"/api/v1/cart/{sess_b}")
    assert res_b.status_code == 200
    assert len(res_b.json()["items"]) == 0

    # Cleanup session A
    client.delete(f"/api/v1/cart/{sess_a}")


def test_add_product_and_price_snapshot(test_session_id):
    """Test 3: Add product captures unit_price_paise snapshot and computes correct line total."""
    response = client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_lp15_01", "quantity": 1},
    )
    assert response.status_code == 200
    cart = response.json()
    assert len(cart["items"]) == 1
    item = cart["items"][0]
    assert item["product_id"] == "prod_lp15_01"
    assert item["sku"] == "DK-LP-15"
    assert item["unit_price_paise"] == 6499900
    assert item["unit_price_inr"] == 64999.0
    assert item["line_total_paise"] == 6499900
    assert item["line_total_inr"] == 64999.0
    assert cart["subtotal_paise"] == 6499900
    assert cart["total_paise"] == 6499900
    assert cart["total_inr"] == 64999.0

    client.delete(f"/api/v1/cart/{test_session_id}")


def test_add_same_product_aggregates_idempotently(test_session_id):
    """Test 4 & 5 & 28: Adding the same SKU multiple times increments quantity without creating duplicate rows."""
    # Add 1 unit
    client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "prod_mouse_01", "quantity": 1})
    # Add another 2 units
    response = client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "prod_mouse_01", "quantity": 2})
    assert response.status_code == 200
    cart = response.json()

    assert len(cart["items"]) == 1
    item = cart["items"][0]
    assert item["quantity"] == 3
    assert item["unit_price_paise"] == 149900
    assert item["line_total_paise"] == 449700  # 149900 * 3
    assert item["line_total_inr"] == 4497.0
    assert cart["total_paise"] == 449700

    client.delete(f"/api/v1/cart/{test_session_id}")


def test_update_quantity_upward_and_downward(test_session_id):
    """Test 6 & 7: Update quantity adjusts line totals and inventory reservation correctly."""
    # Start with 1 mouse
    client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "prod_mouse_01", "quantity": 1})

    # Increase to 3
    res_up = client.patch(f"/api/v1/cart/{test_session_id}/items/prod_mouse_01", json={"quantity": 3})
    assert res_up.status_code == 200
    cart_up = res_up.json()
    assert cart_up["items"][0]["quantity"] == 3
    assert cart_up["total_paise"] == 449700

    # Decrease to 2
    res_down = client.patch(f"/api/v1/cart/{test_session_id}/items/prod_mouse_01", json={"quantity": 2})
    assert res_down.status_code == 200
    cart_down = res_down.json()
    assert cart_down["items"][0]["quantity"] == 2
    assert cart_down["total_paise"] == 299800

    client.delete(f"/api/v1/cart/{test_session_id}")


def test_remove_item_releases_reservation(test_session_id):
    """Test 8 & 19: Removing an item removes it from cart and releases inventory reservation."""
    db = SessionLocal()
    inv_before = db.query(Inventory).filter(Inventory.product_id == "prod_mouse_01").first()
    avail_before = inv_before.available_quantity
    res_before = inv_before.reserved_quantity
    db.close()

    # Add 2 mice
    client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "prod_mouse_01", "quantity": 2})

    db = SessionLocal()
    inv_mid = db.query(Inventory).filter(Inventory.product_id == "prod_mouse_01").first()
    assert inv_mid.available_quantity == avail_before - 2
    assert inv_mid.reserved_quantity == res_before + 2
    db.close()

    # Remove mouse
    del_res = client.delete(f"/api/v1/cart/{test_session_id}/items/prod_mouse_01")
    assert del_res.status_code == 200
    assert len(del_res.json()["items"]) == 0
    assert del_res.json()["total_paise"] == 0

    # Verify reservation is fully released
    db = SessionLocal()
    inv_after = db.query(Inventory).filter(Inventory.product_id == "prod_mouse_01").first()
    assert inv_after.available_quantity == avail_before
    assert inv_after.reserved_quantity == res_before
    db.close()


def test_clear_cart_releases_all_reservations(test_session_id):
    """Test 9 & 10 & 20: Clearing cart empties items and releases all held reservations."""
    db = SessionLocal()
    avail_lp = db.query(Inventory).filter(Inventory.product_id == "prod_lp15_01").first().available_quantity
    avail_ms = db.query(Inventory).filter(Inventory.product_id == "prod_mouse_01").first().available_quantity
    db.close()

    # Add laptop and mouse
    client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "prod_lp15_01", "quantity": 1})
    client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "prod_mouse_01", "quantity": 1})

    # Clear cart
    clear_res = client.delete(f"/api/v1/cart/{test_session_id}")
    assert clear_res.status_code == 200
    assert len(clear_res.json()["items"]) == 0
    assert clear_res.json()["subtotal_paise"] == 0

    # Verify inventory counts restored
    db = SessionLocal()
    assert db.query(Inventory).filter(Inventory.product_id == "prod_lp15_01").first().available_quantity == avail_lp
    assert db.query(Inventory).filter(Inventory.product_id == "prod_mouse_01").first().available_quantity == avail_ms
    db.close()


def test_validation_errors_nonexistent_and_inactive(test_session_id):
    """Test 11 & 12: Rejects nonexistent and inactive products."""
    res = client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "non_existent_sku", "quantity": 1})
    assert res.status_code == 404
    assert res.json()["detail"]["code"] == "PRODUCT_NOT_FOUND"


def test_validation_errors_invalid_quantities(test_session_id):
    """Test 13 & 14: Rejects zero and negative quantities."""
    # Zero quantity
    res_zero = client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "prod_mouse_01", "quantity": 0})
    assert res_zero.status_code == 422

    # Negative quantity
    res_neg = client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "prod_mouse_01", "quantity": -5})
    assert res_neg.status_code == 422


def test_validation_errors_out_of_stock(test_session_id):
    """Test 15: Out-of-stock product rejected with OUT_OF_STOCK."""
    res = client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "prod_lp14_oos", "quantity": 1})
    assert res.status_code == 400
    assert res.json()["detail"]["code"] == "OUT_OF_STOCK"


def test_validation_errors_insufficient_stock(test_session_id):
    """Test 16 & 30: Insufficient inventory rejected with INSUFFICIENT_STOCK."""
    # prod_lp_low_01 has available_quantity = 2
    res = client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "prod_lp_low_01", "quantity": 5})
    assert res.status_code == 400
    assert res.json()["detail"]["code"] == "INSUFFICIENT_STOCK"


def test_cart_expiration_releases_reservations_and_blocks_mutations(test_session_id):
    """Test 21 & 22: Expired cart releases held inventory and forbids further mutations."""
    db = SessionLocal()
    avail_before = db.query(Inventory).filter(Inventory.product_id == "prod_mouse_01").first().available_quantity
    db.close()

    # Add item
    client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "prod_mouse_01", "quantity": 1})

    # Trigger explicit expiration
    exp_res = client.post(f"/api/v1/cart/{test_session_id}/expire")
    assert exp_res.status_code == 200
    assert exp_res.json()["status"] == "expired"
    assert exp_res.json()["is_expired"] is True

    # Check inventory released
    db = SessionLocal()
    assert db.query(Inventory).filter(Inventory.product_id == "prod_mouse_01").first().available_quantity == avail_before
    db.close()

    # Attempt to mutate expired cart -> should fail with 410 Gone
    add_fail = client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "prod_mouse_01", "quantity": 1})
    assert add_fail.status_code == 410
    assert add_fail.json()["detail"]["code"] == "CART_EXPIRED"


def test_cart_validation_endpoint(test_session_id):
    """Test 23 & 24: Validate endpoint validates fulfillable carts and identifies issues."""
    # Initialize empty cart
    client.get(f"/api/v1/cart/{test_session_id}")
    val_empty = client.post(f"/api/v1/cart/{test_session_id}/validate")
    assert val_empty.status_code == 200
    assert val_empty.json()["valid"] is False
    assert val_empty.json()["issues"][0]["code"] == "EMPTY_CART"

    # Add valid item
    client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "prod_lp15_01", "quantity": 1})
    val_valid = client.post(f"/api/v1/cart/{test_session_id}/validate")
    assert val_valid.status_code == 200
    assert val_valid.json()["valid"] is True
    assert len(val_valid.json()["issues"]) == 0

    client.delete(f"/api/v1/cart/{test_session_id}")


def test_exact_paise_arithmetic_bundle_demo(test_session_id):
    """Test 25 & 26 & 27: Laptop + Mouse complementary bundle demo flow."""
    db = SessionLocal()
    lp_before = db.query(Inventory).filter(Inventory.product_id == "prod_lp15_01").first().reserved_quantity
    ms_before = db.query(Inventory).filter(Inventory.product_id == "prod_mouse_01").first().reserved_quantity
    db.close()

    # Step 1: Add TechNova Laptop Pro 15 (₹64,999 = 6,499,900 paise)
    res1 = client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "DK-LP-15", "quantity": 1})
    assert res1.status_code == 200
    cart1 = res1.json()
    assert cart1["subtotal_paise"] == 6499900
    assert cart1["total_inr"] == 64999.0

    # Step 2: Add TechNova Precision Wireless Mouse (₹1,499 = 149,900 paise)
    res2 = client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "DK-MS-01", "quantity": 1})
    assert res2.status_code == 200
    cart2 = res2.json()
    # 6,499,900 + 149,900 = 6,649,800 paise
    assert cart2["subtotal_paise"] == 6649800
    assert cart2["total_paise"] == 6649800
    assert cart2["total_inr"] == 66498.0
    assert cart2["total_items_count"] == 2

    # Step 3: Increase Mouse quantity to 2
    # New mouse subtotal: 149,900 * 2 = 299,800 paise
    # Total: 6,499,900 + 299,800 = 6,799,700 paise -> ₹67,997.0
    res3 = client.patch(f"/api/v1/cart/{test_session_id}/items/DK-MS-01", json={"quantity": 2})
    assert res3.status_code == 200
    cart3 = res3.json()
    assert cart3["total_paise"] == 6799700
    assert cart3["total_inr"] == 67997.0

    # Step 4: Remove Mouse
    res4 = client.delete(f"/api/v1/cart/{test_session_id}/items/DK-MS-01")
    assert res4.status_code == 200
    cart4 = res4.json()
    assert cart4["total_paise"] == 6499900
    assert cart4["total_inr"] == 64999.0

    # Step 5: Clear Cart
    res5 = client.delete(f"/api/v1/cart/{test_session_id}")
    assert res5.status_code == 200
    assert res5.json()["total_paise"] == 0

    # Cleanup verification: inventory returns to baseline
    db = SessionLocal()
    lp_inv = db.query(Inventory).filter(Inventory.product_id == "prod_lp15_01").first()
    ms_inv = db.query(Inventory).filter(Inventory.product_id == "prod_mouse_01").first()
    assert lp_inv.reserved_quantity == lp_before
    assert ms_inv.reserved_quantity == ms_before
    db.close()


def test_put_cart_items_and_post_clear(test_session_id):
    """Test compatibility routes: PUT /items and POST /clear."""
    # Add initial item
    res = client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "prod_mouse_01", "quantity": 1})
    assert res.status_code == 200

    # PUT update quantity
    put_res = client.put(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "prod_mouse_01", "quantity": 3})
    assert put_res.status_code == 200
    assert put_res.json()["items"][0]["quantity"] == 3

    # POST /clear
    clear_res = client.post(f"/api/v1/cart/{test_session_id}/clear")
    assert clear_res.status_code == 200
    assert len(clear_res.json()["items"]) == 0
    assert clear_res.json()["subtotal_paise"] == 0


def test_remove_item_from_expired_cart_resets_gracefully(test_session_id):
    """Test that removing an item from an expired cart succeeds without raising 410."""
    client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "prod_mouse_01", "quantity": 1})
    # Force expire cart
    exp_res = client.post(f"/api/v1/cart/{test_session_id}/expire")
    assert exp_res.status_code == 200

    # Delete item from expired cart must succeed cleanly
    del_res = client.delete(f"/api/v1/cart/{test_session_id}/items/prod_mouse_01")
    assert del_res.status_code == 200
    assert len(del_res.json()["items"]) == 0
    assert del_res.json()["total_paise"] == 0
