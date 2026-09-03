"""
Session Security and Isolation Tests for Kharridlo.
Verifies that buyers cannot cross session boundaries to inspect carts, hijack checkouts, or access orders.
Confirms that Gemini agent tool registry remains bounded with zero payment tools.
"""
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.agent.tools import BOUNDED_TOOLS
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.product import Product

client = TestClient(app)


@pytest.fixture(autouse=True)
def ensure_inventory():
    db = SessionLocal()
    try:
        p = db.query(Product).filter(Product.id == "prod_mouse_01").first()
        if p and p.inventory:
            p.inventory.available_quantity = 50
            p.inventory.reserved_quantity = 0
            db.commit()
    finally:
        db.close()


def test_session_cart_isolation():
    """Session A's cart is strictly isolated from Session B's cart."""
    sess_a = f"buyer_a_{uuid.uuid4().hex[:8]}"
    sess_b = f"buyer_b_{uuid.uuid4().hex[:8]}"

    # Buyer A adds an item
    client.post(f"/api/v1/cart/{sess_a}/items", json={"product_id": "prod_mouse_01", "quantity": 1})
    cart_a = client.get(f"/api/v1/cart/{sess_a}").json()
    assert len(cart_a["items"]) == 1

    # Buyer B views their own cart -> must be empty
    cart_b = client.get(f"/api/v1/cart/{sess_b}").json()
    assert len(cart_b["items"]) == 0


def test_session_cannot_hijack_unrelated_checkout():
    """Session B cannot confirm or create an order using Session A's checkout ID."""
    sess_a = f"buyer_a_{uuid.uuid4().hex[:8]}"
    sess_b = f"buyer_b_{uuid.uuid4().hex[:8]}"

    # Buyer A adds item and confirms checkout
    client.post(f"/api/v1/cart/{sess_a}/items", json={"product_id": "prod_mouse_01", "quantity": 1})
    chk_a = client.post(
        f"/api/v1/checkout/confirm?session_id={sess_a}",
        json={"buyer_confirmed": True},
        headers={"X-Session-ID": sess_a}
    ).json()

    assert "id" in chk_a

    # Buyer B attempts to create payment order using Buyer A's checkout_id
    hijack_res = client.post(
        f"/api/v1/payments/orders?session_id={sess_b}",
        json={"checkout_id": chk_a["id"]},
        headers={"X-Session-ID": sess_b}
    )
    assert hijack_res.status_code == 404
    assert hijack_res.json()["detail"]["code"] == "CHECKOUT_NOT_FOUND"


def test_session_cannot_view_unrelated_order():
    """Session B cannot query Session A's payment order."""
    sess_a = f"buyer_a_{uuid.uuid4().hex[:8]}"
    sess_b = f"buyer_b_{uuid.uuid4().hex[:8]}"

    # Buyer A creates order
    client.post(f"/api/v1/cart/{sess_a}/items", json={"product_id": "prod_mouse_01", "quantity": 1})
    chk_a = client.post(
        f"/api/v1/checkout/confirm?session_id={sess_a}",
        json={"buyer_confirmed": True},
        headers={"X-Session-ID": sess_a}
    ).json()

    order_a = client.post(
        f"/api/v1/payments/orders?session_id={sess_a}",
        json={"checkout_id": chk_a["id"]},
        headers={"X-Session-ID": sess_a}
    ).json()

    # Buyer B tries to read Buyer A's order with X-Session-ID: sess_b
    snoop_res = client.get(
        f"/api/v1/payments/orders/{order_a['internal_order_id']}",
        headers={"X-Session-ID": sess_b}
    )
    assert snoop_res.status_code == 404
    assert snoop_res.json()["detail"]["code"] == "ORDER_NOT_FOUND"


def test_session_cannot_cancel_unrelated_order():
    """Session B cannot cancel Session A's payment order."""
    sess_a = f"buyer_a_{uuid.uuid4().hex[:8]}"
    sess_b = f"buyer_b_{uuid.uuid4().hex[:8]}"

    client.post(f"/api/v1/cart/{sess_a}/items", json={"product_id": "prod_mouse_01", "quantity": 1})
    chk_a = client.post(
        f"/api/v1/checkout/confirm?session_id={sess_a}",
        json={"buyer_confirmed": True},
        headers={"X-Session-ID": sess_a}
    ).json()

    order_a = client.post(
        f"/api/v1/payments/orders?session_id={sess_a}",
        json={"checkout_id": chk_a["id"]},
        headers={"X-Session-ID": sess_a}
    ).json()

    # Buyer B attempts cancellation
    cancel_res = client.post(
        f"/api/v1/payments/cancel?session_id={sess_b}",
        json={"internal_order_id": order_a["internal_order_id"], "reason": "malicious_cancel"},
        headers={"X-Session-ID": sess_b}
    )
    assert cancel_res.status_code == 404


def test_gemini_tool_registry_has_zero_payment_authority():
    """Security verification that Gemini agent has strictly no payment creation tools."""
    tool_names = list(BOUNDED_TOOLS.keys())

    # Verify exactly the 7 bounded tools
    expected_tools = {
        "search_products",
        "get_product",
        "get_cart",
        "add_to_cart",
        "update_cart_item",
        "remove_from_cart",
        "evaluate_policy",
    }
    assert set(tool_names) == expected_tools
    assert len(tool_names) == 7

    # Explicitly ensure payment keywords are completely absent
    for name in tool_names:
        lower = name.lower()
        assert "pay" not in lower
        assert "charge" not in lower
        assert "checkout" not in lower
        assert "razorpay" not in lower
        assert "order" not in lower
        assert "token" not in lower


def test_secret_redaction_in_responses_and_models():
    """Ensure RAZORPAY_KEY_SECRET is not exposed in public schemas or settings exports."""
    # Verify settings representation hides/does not serialize raw secrets
    app_info = client.get("/health").json()
    assert "secret" not in str(app_info).lower()

    # Verify order creation response does NOT include key_secret
    sess_a = f"audit_sess_{uuid.uuid4().hex[:8]}"
    client.post(f"/api/v1/cart/{sess_a}/items", json={"product_id": "prod_mouse_01", "quantity": 1})
    chk = client.post(f"/api/v1/checkout/confirm?session_id={sess_a}", json={"buyer_confirmed": True}).json()
    order = client.post(f"/api/v1/payments/orders?session_id={sess_a}", json={"checkout_id": chk["id"]}).json()

    assert "key_id" in order
    assert "key_secret" not in order
    assert "secret" not in str(order).lower()
