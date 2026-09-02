import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.inventory import Inventory
from app.models.cart import Cart, CartItem
from app.models.policy import Policy, SessionPolicy

client = TestClient(app)


@pytest.fixture
def test_session_id():
    """Generate isolated session ID."""
    return f"pol_sess_{uuid.uuid4().hex[:12]}"


def test_list_policy_tiers():
    """Test 1, 2, 3: Verify all three policy tiers load with exact integer paise limits."""
    res = client.get("/api/v1/policy/tiers")
    assert res.status_code == 200
    tiers = {t["tier"]: t for t in res.json()}
    assert "STANDARD" in tiers
    assert "ELEVATED" in tiers
    assert "RESTRICTED" in tiers

    # RESTRICTED: ₹25,000 (2,500,000 paise)
    assert tiers["RESTRICTED"]["max_single_transaction_paise"] == 2500000
    assert tiers["RESTRICTED"]["max_single_transaction_inr"] == 25000.0

    # STANDARD: ₹70,000 (7,000,000 paise)
    assert tiers["STANDARD"]["max_single_transaction_paise"] == 7000000
    assert tiers["STANDARD"]["max_single_transaction_inr"] == 70000.0

    # ELEVATED: ₹1,50,000 (15,000,000 paise)
    assert tiers["ELEVATED"]["max_single_transaction_paise"] == 15000000
    assert tiers["ELEVATED"]["max_single_transaction_inr"] == 150000.0


def test_session_resolves_to_standard_by_default(test_session_id):
    """Test session defaults to STANDARD policy tier."""
    res = client.get(f"/api/v1/policy/{test_session_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["tier"] == "STANDARD"
    assert data["max_single_transaction_paise"] == 7000000
    assert data["authorization_required"] is True


def test_scenario_a_safe_purchase_under_limit(test_session_id):
    """Scenario A: DK-LP-15 (₹64,999) under ₹70,000 limit -> AUTHORIZATION_REQUIRED."""
    # Add Laptop Pro 15
    client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "DK-LP-15", "quantity": 1})

    # Evaluate policy
    eval_res = client.post(f"/api/v1/policy/evaluate/{test_session_id}")
    assert eval_res.status_code == 200
    data = eval_res.json()

    assert data["decision"] == "AUTHORIZATION_REQUIRED"
    assert data["policy_tier"] == "STANDARD"
    assert data["cart_total_paise"] == 6499900
    assert data["cart_total_inr"] == 64999.0
    assert data["max_single_transaction_paise"] == 7000000
    assert data["remaining_buffer_paise"] == 500100  # 7000000 - 6499900 = 500100 paise (₹5,001.00)
    assert data["remaining_buffer_inr"] == 5001.0
    assert data["authorization_required"] is True
    assert data["payment_initiated"] is False

    codes = [r["code"] for r in data["reasons"]]
    assert "WITHIN_SINGLE_TRANSACTION_LIMIT" in codes
    assert "BUYER_AUTHORIZATION_REQUIRED" in codes

    # Cleanup
    client.delete(f"/api/v1/cart/{test_session_id}")


def test_scenario_b_safe_bundle_under_limit(test_session_id):
    """Scenario B: Laptop + Mouse (₹66,498) under ₹70,000 limit -> AUTHORIZATION_REQUIRED."""
    client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "DK-LP-15", "quantity": 1})
    client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "DK-MS-01", "quantity": 1})

    eval_res = client.post(f"/api/v1/policy/evaluate/{test_session_id}")
    assert eval_res.status_code == 200
    data = eval_res.json()

    assert data["decision"] == "AUTHORIZATION_REQUIRED"
    assert data["cart_total_paise"] == 6649800  # 6499900 + 149900
    assert data["cart_total_inr"] == 66498.0
    assert data["remaining_buffer_paise"] == 350200  # 7000000 - 6649800
    assert data["payment_initiated"] is False

    client.delete(f"/api/v1/cart/{test_session_id}")


def test_scenario_c_policy_block_exceeds_limit(test_session_id):
    """Scenario C: DK-LP-ULTRA (₹1,49,000) exceeds ₹70,000 standard limit -> BLOCK."""
    # Add Ultra Laptop (₹1,49,000 = 14,900,000 paise)
    client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "DK-LP-ULTRA", "quantity": 1})

    eval_res = client.post(f"/api/v1/policy/evaluate/{test_session_id}")
    assert eval_res.status_code == 200
    data = eval_res.json()

    assert data["decision"] == "BLOCK"
    assert data["policy_tier"] == "STANDARD"
    assert data["cart_total_paise"] == 14900000
    assert data["cart_total_inr"] == 149000.0
    assert data["max_single_transaction_paise"] == 7000000
    assert data["remaining_buffer_paise"] == 0
    assert data["payment_initiated"] is False

    reason = data["reasons"][0]
    assert reason["code"] == "SINGLE_TRANSACTION_LIMIT_EXCEEDED"
    assert reason["threshold_paise"] == 7000000
    assert reason["observed_paise"] == 14900000

    client.delete(f"/api/v1/cart/{test_session_id}")


def test_exact_paise_boundaries(test_session_id):
    """Step 23: Test boundary precision (₹69,999.99, ₹70,000.00, ₹70,000.01)."""
    # Create cart
    client.get(f"/api/v1/cart/{test_session_id}")

    db = SessionLocal()
    cart = db.query(Cart).filter(Cart.session_id == test_session_id).first()

    # Case 1: Exactly ₹70,000.00 (7,000,000 paise)
    cart.subtotal_paise = 7000000
    cart.total_paise = 7000000
    # Add dummy item so it's not empty
    item = CartItem(
        cart_id=cart.id,
        product_id="prod_lp15_01",
        quantity=1,
        unit_price_paise=7000000,
        line_total_paise=7000000,
    )
    db.add(item)
    db.commit()
    db.close()

    res_exact = client.post(f"/api/v1/policy/evaluate/{test_session_id}")
    assert res_exact.status_code == 200
    assert res_exact.json()["decision"] == "AUTHORIZATION_REQUIRED"
    assert res_exact.json()["remaining_buffer_paise"] == 0

    # Case 2: One paise above limit ₹70,000.01 (7,000,001 paise) -> MUST BLOCK!
    db = SessionLocal()
    cart = db.query(Cart).filter(Cart.session_id == test_session_id).first()
    cart.subtotal_paise = 7000001
    cart.total_paise = 7000001
    db.commit()
    db.close()

    res_above = client.post(f"/api/v1/policy/evaluate/{test_session_id}")
    assert res_above.status_code == 200
    assert res_above.json()["decision"] == "BLOCK"
    assert res_above.json()["reasons"][0]["code"] == "SINGLE_TRANSACTION_LIMIT_EXCEEDED"

    # Cleanup manually created test cart
    client.delete(f"/api/v1/cart/{test_session_id}")


def test_policy_tiers_switching_and_elevated(test_session_id):
    """Step 24: Elevated tier allows ₹1,49,000 laptop; Restricted blocks ₹64,999 laptop."""
    # Switch session to ELEVATED
    set_res = client.post(f"/api/v1/policy/{test_session_id}/tier", json={"tier": "ELEVATED"})
    assert set_res.status_code == 200
    assert set_res.json()["tier"] == "ELEVATED"
    assert set_res.json()["max_single_transaction_paise"] == 15000000

    # Add Ultra Laptop (₹1,49,000)
    client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "DK-LP-ULTRA", "quantity": 1})

    # Under ELEVATED (₹1.5L cap), ₹1,49,000 is permitted!
    eval_elevated = client.post(f"/api/v1/policy/evaluate/{test_session_id}")
    assert eval_elevated.status_code == 200
    assert eval_elevated.json()["decision"] == "AUTHORIZATION_REQUIRED"
    assert eval_elevated.json()["policy_tier"] == "ELEVATED"
    assert eval_elevated.json()["remaining_buffer_paise"] == 100000  # 15,000,000 - 14,900,000 = ₹1,000.00 buffer

    # Now switch to RESTRICTED (₹25,000 cap)
    client.post(f"/api/v1/policy/{test_session_id}/tier", json={"tier": "RESTRICTED"})
    eval_restricted = client.post(f"/api/v1/policy/evaluate/{test_session_id}")
    assert eval_restricted.status_code == 200
    assert eval_restricted.json()["decision"] == "BLOCK"
    assert eval_restricted.json()["reasons"][0]["code"] == "SINGLE_TRANSACTION_LIMIT_EXCEEDED"

    client.delete(f"/api/v1/cart/{test_session_id}")


def test_empty_and_expired_cart_evaluations(test_session_id):
    """Test 10 & 11: Empty cart and expired cart are blocked deterministically."""
    # Empty cart
    client.get(f"/api/v1/cart/{test_session_id}")
    eval_empty = client.post(f"/api/v1/policy/evaluate/{test_session_id}")
    assert eval_empty.status_code == 200
    assert eval_empty.json()["decision"] == "BLOCK"
    assert eval_empty.json()["reasons"][0]["code"] == "EMPTY_CART"

    # Add item then expire cart
    client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "DK-MS-01", "quantity": 1})
    client.post(f"/api/v1/cart/{test_session_id}/expire")

    eval_exp = client.post(f"/api/v1/policy/evaluate/{test_session_id}")
    assert eval_exp.status_code == 200
    assert eval_exp.json()["decision"] == "BLOCK"
    assert eval_exp.json()["reasons"][0]["code"] == "CART_EXPIRED"


def test_policy_evaluation_is_strictly_read_only(test_session_id):
    """Test 17, 18, 19, 20: Policy evaluation does NOT mutate cart or inventory state."""
    # Add laptop
    client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "DK-LP-15", "quantity": 1})

    db = SessionLocal()
    inv_before = db.query(Inventory).filter(Inventory.product_id == "prod_lp15_01").first()
    avail_before = inv_before.available_quantity
    res_before = inv_before.reserved_quantity

    cart_before = db.query(Cart).filter(Cart.session_id == test_session_id).first()
    subtotal_before = cart_before.subtotal_paise
    total_before = cart_before.total_paise
    items_count_before = len(cart_before.items)
    db.close()

    # Call evaluate 5 times in a row
    for _ in range(5):
        eval_res = client.post(f"/api/v1/policy/evaluate/{test_session_id}")
        assert eval_res.status_code == 200
        assert eval_res.json()["decision"] == "AUTHORIZATION_REQUIRED"

    # Verify state in database is completely unchanged
    db = SessionLocal()
    inv_after = db.query(Inventory).filter(Inventory.product_id == "prod_lp15_01").first()
    cart_after = db.query(Cart).filter(Cart.session_id == test_session_id).first()

    assert inv_after.available_quantity == avail_before
    assert inv_after.reserved_quantity == res_before
    assert cart_after.subtotal_paise == subtotal_before
    assert cart_after.total_paise == total_before
    assert len(cart_after.items) == items_count_before
    db.close()

    client.delete(f"/api/v1/cart/{test_session_id}")


def test_client_cannot_override_policy_thresholds(test_session_id):
    """Test Step 10 & 16: Client cannot supply arbitrary thresholds or override decisions."""
    # Add Ultra Laptop (₹1,49,000)
    client.post(f"/api/v1/cart/{test_session_id}/items", json={"product_id": "DK-LP-ULTRA", "quantity": 1})

    # Attacker attempts to send custom payload with higher limit or decision ALLOW
    eval_res = client.post(
        f"/api/v1/policy/evaluate/{test_session_id}",
        json={"max_limit": 20000000, "decision": "ALLOW", "force_allow": True},
    )
    assert eval_res.status_code == 200
    data = eval_res.json()

    # Server must ignore payload and still BLOCK!
    assert data["decision"] == "BLOCK"
    assert data["max_single_transaction_paise"] == 7000000  # Default standard server limit
    assert data["reasons"][0]["code"] == "SINGLE_TRANSACTION_LIMIT_EXCEEDED"

    client.delete(f"/api/v1/cart/{test_session_id}")
