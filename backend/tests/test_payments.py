import pytest
import uuid
import json
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.models.cart import Cart
from app.models.inventory import Inventory
from app.models.payment import CheckoutSession, PaymentOrder, PaymentAttempt, AuditEvent
from app.models.policy import SessionPolicy
from app.services.razorpay_client import razorpay_client
from app.agent.tools import BOUNDED_TOOLS

from app.models.product import Product

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_test_inventory():
    """Ensure test products have stock available before and after test execution."""
    db = SessionLocal()
    try:
        for pid in ["prod_mouse_01", "DK-LP-15", "DK-KB-01"]:
            product = db.query(Product).filter((Product.id == pid) | (Product.sku == pid)).first()
            if product and product.inventory:
                product.inventory.available_quantity = 50
                product.inventory.reserved_quantity = 0
        db.commit()
    finally:
        db.close()
    yield
    db = SessionLocal()
    try:
        for pid in ["prod_mouse_01", "DK-LP-15", "DK-KB-01"]:
            product = db.query(Product).filter((Product.id == pid) | (Product.sku == pid)).first()
            if product and product.inventory:
                product.inventory.available_quantity = 50
                product.inventory.reserved_quantity = 0
        db.commit()
    finally:
        db.close()


@pytest.fixture
def test_session_id():
    """Generate isolated session ID for each test."""
    return f"pay_sess_{uuid.uuid4().hex[:12]}"


def test_gemini_tools_contain_zero_payment_tools():
    """Security Check: Gemini tool registry must contain strictly 0 payment tools."""
    payment_keywords = ["payment", "razorpay", "checkout", "charge", "refund", "card", "upi", "webhook"]

    # Verify strictly 7 bounded tools
    assert len(BOUNDED_TOOLS) == 7

    for tool_name, tool_func in BOUNDED_TOOLS.items():
        name = tool_name.lower()
        doc = (tool_func.__doc__ or "").lower()
        for kw in payment_keywords:
            assert kw not in name, f"Security violation: tool '{tool_name}' contains payment keyword '{kw}'"
            assert kw not in doc, f"Security violation: tool '{tool_name}' description references '{kw}'"


def test_checkout_confirm_requires_session_id():
    """Checkout confirm rejects requests with no session identifier."""
    res = client.post("/api/v1/checkout/confirm", json={"buyer_confirmed": True})
    assert res.status_code == 400
    assert res.json()["detail"]["code"] == "MISSING_SESSION_ID"


def test_checkout_confirm_empty_cart_fails(test_session_id):
    """Cannot start checkout with an empty cart."""
    res = client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": True}
    )
    assert res.status_code == 400
    assert res.json()["detail"]["code"] == "CART_EMPTY"


def test_checkout_confirm_creates_session_and_snapshots_items(test_session_id):
    """Adding product and confirming checkout creates CheckoutSession with immutable item snapshot."""
    # Add product
    add_res = client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 2}
    )
    assert add_res.status_code == 200

    # Confirm checkout with buyer_confirmed=False (review stage)
    chk_res = client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": False}
    )
    assert chk_res.status_code == 200
    data = chk_res.json()
    assert data["session_id"] == test_session_id
    assert data["total_paise"] == 299800  # 2 x ₹1,499 = ₹2,998 = 299,800 paise
    assert data["buyer_confirmed"] is False
    assert len(data["cart_snapshot"]) == 1
    assert data["cart_snapshot"][0]["product_id"] == "prod_mouse_01"
    assert data["cart_snapshot"][0]["quantity"] == 2


def test_checkout_confirm_explicit_buyer_authorization(test_session_id):
    """Explicit buyer confirmation transitions checkout to BUYER_CONFIRMED."""
    client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1}
    )

    res = client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": True}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["buyer_confirmed"] is True
    assert data["buyer_confirmed_at"] is not None
    assert data["status"] == "BUYER_CONFIRMED"


def test_checkout_session_get_endpoint(test_session_id):
    """GET /api/v1/checkout/session returns active checkout session."""
    client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1}
    )
    client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": True}
    )

    get_res = client.get(f"/api/v1/checkout/session?session_id={test_session_id}")
    assert get_res.status_code == 200
    assert get_res.json()["session_id"] == test_session_id
    assert get_res.json()["buyer_confirmed"] is True


def test_create_payment_order_requires_buyer_confirmation(test_session_id):
    """Creating Razorpay order fails if buyer confirmation is not granted."""
    client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1}
    )
    # Review without confirming
    chk = client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": False}
    ).json()

    order_res = client.post(
        f"/api/v1/payments/orders?session_id={test_session_id}",
        json={"checkout_id": chk["id"]}
    )
    assert order_res.status_code == 400
    assert order_res.json()["detail"]["code"] == "CONFIRMATION_REQUIRED"


def test_server_creates_razorpay_order_successfully(test_session_id):
    """Happy path: complete flow creates order with server-calculated integer paise amount."""
    client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1}
    )
    chk = client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": True}
    ).json()

    order_res = client.post(
        f"/api/v1/payments/orders?session_id={test_session_id}",
        json={"checkout_id": chk["id"]}
    )
    assert order_res.status_code == 200
    data = order_res.json()
    assert "internal_order_id" in data
    assert data["razorpay_order_id"].startswith("order_")
    assert data["amount_paise"] == 149900  # ₹1,499.00 = 149,900 paise
    assert data["amount_inr"] == 1499.0
    assert data["currency"] == "INR"
    assert data["status"] == "created"
    assert "key_id" in data


def test_amount_calculated_from_cart_not_frontend(test_session_id):
    """Amount is strictly taken from backend cart; frontend input cannot tamper with price."""
    client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1}
    )
    chk = client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": True}
    ).json()

    # Client payload only takes checkout_id; no amount parameter exists
    order_res = client.post(
        f"/api/v1/payments/orders?session_id={test_session_id}",
        json={"checkout_id": chk["id"]}
    )
    assert order_res.status_code == 200
    assert order_res.json()["amount_paise"] == 149900


def test_idempotent_order_creation_returns_existing_order(test_session_id):
    """Calling order creation multiple times returns the exact same active order."""
    client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1}
    )
    chk = client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": True}
    ).json()

    order1 = client.post(
        f"/api/v1/payments/orders?session_id={test_session_id}",
        json={"checkout_id": chk["id"]}
    ).json()

    order2 = client.post(
        f"/api/v1/payments/orders?session_id={test_session_id}",
        json={"checkout_id": chk["id"]}
    ).json()

    assert order1["internal_order_id"] == order2["internal_order_id"]
    assert order1["razorpay_order_id"] == order2["razorpay_order_id"]


def test_policy_revalidation_before_order_creation_blocks_if_limit_exceeded(test_session_id):
    """Policy revalidation immediately before order creation rejects if limit is exceeded."""
    db = SessionLocal()
    try:
        # Set session policy to RESTRICTED (limit ₹25,000 / 2,500,000 paise)
        sp = db.query(SessionPolicy).filter(SessionPolicy.session_id == test_session_id).first()
        if not sp:
            sp = SessionPolicy(session_id=test_session_id, policy_tier="RESTRICTED")
            db.add(sp)
        else:
            sp.policy_tier = "RESTRICTED"
        db.commit()
    finally:
        db.close()

    # Add high-value laptop (DK-LP-15: ₹55,000 / 5,500,000 paise)
    client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "DK-LP-15", "quantity": 1}
    )

    # Initiating checkout correctly flags BLOCKED
    chk = client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": False}
    ).json()
    assert chk["status"] == "BLOCKED"

    # Attempting order creation returns 403 Forbidden
    order_res = client.post(
        f"/api/v1/payments/orders?session_id={test_session_id}",
        json={"checkout_id": chk["id"]}
    )
    assert order_res.status_code == 400 or order_res.status_code == 403


def test_cart_modification_invalidates_prior_buyer_confirmation(test_session_id):
    """Modifying cart items after confirmation invalidates the confirmation and rejects order creation."""
    client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1}
    )
    chk = client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": True}
    ).json()
    assert chk["buyer_confirmed"] is True

    # User alters cart behind the scenes
    client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1}
    )

    # Order creation rejects with 409 CART_MODIFIED
    order_res = client.post(
        f"/api/v1/payments/orders?session_id={test_session_id}",
        json={"checkout_id": chk["id"]}
    )
    assert order_res.status_code == 409
    assert order_res.json()["detail"]["code"] == "CART_MODIFIED"


def test_expired_checkout_cannot_create_order(test_session_id):
    """Expired checkout session cannot be used to create a payment order."""
    client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1}
    )
    chk = client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": True}
    ).json()

    # Fast-forward expiration in database
    db = SessionLocal()
    try:
        cs = db.query(CheckoutSession).filter(CheckoutSession.id == chk["id"]).first()
        cs.expires_at = datetime.now(timezone.utc) - timedelta(minutes=5)
        db.commit()
    finally:
        db.close()

    order_res = client.post(
        f"/api/v1/payments/orders?session_id={test_session_id}",
        json={"checkout_id": chk["id"]}
    )
    assert order_res.status_code == 400
    assert order_res.json()["detail"]["code"] == "CHECKOUT_EXPIRED"


def test_valid_payment_signature_verification_succeeds(test_session_id):
    """Cryptographic signature verification passes, captures payment, and updates order status."""
    client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1}
    )
    chk = client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": True}
    ).json()

    order = client.post(
        f"/api/v1/payments/orders?session_id={test_session_id}",
        json={"checkout_id": chk["id"]}
    ).json()

    payment_id = f"pay_test_{uuid.uuid4().hex[:12]}"
    valid_signature = razorpay_client.generate_test_signature(
        razorpay_order_id=order["razorpay_order_id"],
        razorpay_payment_id=payment_id,
    )

    verify_res = client.post(
        "/api/v1/payments/verify",
        json={
            "internal_order_id": order["internal_order_id"],
            "razorpay_order_id": order["razorpay_order_id"],
            "razorpay_payment_id": payment_id,
            "razorpay_signature": valid_signature,
        }
    )
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["verified"] is True
    assert v_data["status"] == "CAPTURED"
    assert v_data["razorpay_payment_id"] == payment_id

    # Verify order status updated to paid
    order_status = client.get(f"/api/v1/payments/orders/{order['internal_order_id']}").json()
    assert order_status["status"] == "paid"


def test_invalid_payment_signature_is_rejected(test_session_id):
    """Forged signature is strictly rejected with 400 INVALID_SIGNATURE."""
    client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1}
    )
    chk = client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": True}
    ).json()

    order = client.post(
        f"/api/v1/payments/orders?session_id={test_session_id}",
        json={"checkout_id": chk["id"]}
    ).json()

    payment_id = f"pay_test_{uuid.uuid4().hex[:12]}"
    forged_signature = "bad_signature_00000000000000000000000000000000"

    verify_res = client.post(
        "/api/v1/payments/verify",
        json={
            "internal_order_id": order["internal_order_id"],
            "razorpay_order_id": order["razorpay_order_id"],
            "razorpay_payment_id": payment_id,
            "razorpay_signature": forged_signature,
        }
    )
    assert verify_res.status_code == 400
    assert verify_res.json()["detail"]["code"] == "INVALID_SIGNATURE"


def test_mismatched_order_id_is_rejected(test_session_id):
    """Verification payload with mismatched razorpay_order_id is rejected."""
    client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1}
    )
    chk = client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": True}
    ).json()

    order = client.post(
        f"/api/v1/payments/orders?session_id={test_session_id}",
        json={"checkout_id": chk["id"]}
    ).json()

    verify_res = client.post(
        "/api/v1/payments/verify",
        json={
            "internal_order_id": order["internal_order_id"],
            "razorpay_order_id": "order_completely_different_id",
            "razorpay_payment_id": "pay_test_123",
            "razorpay_signature": "dummy_signature",
        }
    )
    assert verify_res.status_code == 400
    assert verify_res.json()["detail"]["code"] == "ORDER_MISMATCH"


def test_repeated_payment_verification_is_idempotent(test_session_id):
    """Calling verify twice with the same captured payment returns success idempotently."""
    client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1}
    )
    chk = client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": True}
    ).json()

    order = client.post(
        f"/api/v1/payments/orders?session_id={test_session_id}",
        json={"checkout_id": chk["id"]}
    ).json()

    payment_id = f"pay_test_{uuid.uuid4().hex[:12]}"
    signature = razorpay_client.generate_test_signature(
        razorpay_order_id=order["razorpay_order_id"],
        razorpay_payment_id=payment_id,
    )

    payload = {
        "internal_order_id": order["internal_order_id"],
        "razorpay_order_id": order["razorpay_order_id"],
        "razorpay_payment_id": payment_id,
        "razorpay_signature": signature,
    }

    res1 = client.post("/api/v1/payments/verify", json=payload)
    res2 = client.post("/api/v1/payments/verify", json=payload)

    assert res1.status_code == 200
    assert res2.status_code == 200
    assert res1.json()["status"] == "CAPTURED"
    assert res2.json()["status"] == "CAPTURED"


def test_inventory_consumption_is_finalized_and_not_double_decremented(test_session_id):
    """Upon successful payment, inventory is permanently finalized and not double-decremented."""
    db = SessionLocal()
    try:
        inv_before = db.query(Inventory).filter(Inventory.product_id == "prod_mouse_01").first()
        initial_avail = inv_before.available_quantity
        initial_res = inv_before.reserved_quantity
    finally:
        db.close()

    # Add 1 item
    client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1}
    )

    # Confirm and order
    chk = client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": True}
    ).json()
    order = client.post(
        f"/api/v1/payments/orders?session_id={test_session_id}",
        json={"checkout_id": chk["id"]}
    ).json()

    # Verify
    payment_id = f"pay_test_{uuid.uuid4().hex[:12]}"
    signature = razorpay_client.generate_test_signature(
        razorpay_order_id=order["razorpay_order_id"],
        razorpay_payment_id=payment_id,
    )
    client.post(
        "/api/v1/payments/verify",
        json={
            "internal_order_id": order["internal_order_id"],
            "razorpay_order_id": order["razorpay_order_id"],
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature,
        }
    )

    db = SessionLocal()
    try:
        inv_after = db.query(Inventory).filter(Inventory.product_id == "prod_mouse_01").first()
        # Reserved quantity must be 0 (consumed), and available remains decremented by 1
        assert inv_after.available_quantity == initial_avail - 1
        assert inv_after.reserved_quantity == initial_res
    finally:
        db.close()


def test_payment_cancellation_flow(test_session_id):
    """User cancelling checkout transitions order to cancelled state."""
    client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1}
    )
    chk = client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": True}
    ).json()
    order = client.post(
        f"/api/v1/payments/orders?session_id={test_session_id}",
        json={"checkout_id": chk["id"]}
    ).json()

    cancel_res = client.post(
        f"/api/v1/payments/cancel?session_id={test_session_id}",
        json={"internal_order_id": order["internal_order_id"], "reason": "user_closed_checkout_modal"}
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    order_check = client.get(f"/api/v1/payments/orders/{order['internal_order_id']}").json()
    assert order_check["status"] == "cancelled"


def test_cannot_cancel_already_paid_order(test_session_id):
    """Cannot cancel an order that has already been verified and paid."""
    client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1}
    )
    chk = client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": True}
    ).json()
    order = client.post(
        f"/api/v1/payments/orders?session_id={test_session_id}",
        json={"checkout_id": chk["id"]}
    ).json()

    payment_id = f"pay_test_{uuid.uuid4().hex[:12]}"
    signature = razorpay_client.generate_test_signature(
        razorpay_order_id=order["razorpay_order_id"],
        razorpay_payment_id=payment_id,
    )
    client.post(
        "/api/v1/payments/verify",
        json={
            "internal_order_id": order["internal_order_id"],
            "razorpay_order_id": order["razorpay_order_id"],
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature,
        }
    )

    # Attempt to cancel
    cancel_res = client.post(
        f"/api/v1/payments/cancel?session_id={test_session_id}",
        json={"internal_order_id": order["internal_order_id"]}
    )
    assert cancel_res.status_code == 400
    assert cancel_res.json()["detail"]["code"] == "ORDER_ALREADY_PAID"


def test_valid_webhook_signature_accepted_and_processes_capture(test_session_id):
    """Webhook with valid signature processes payment.captured event."""
    client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1}
    )
    chk = client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": True}
    ).json()
    order = client.post(
        f"/api/v1/payments/orders?session_id={test_session_id}",
        json={"checkout_id": chk["id"]}
    ).json()

    event_id = f"event_{uuid.uuid4().hex[:12]}"
    payment_id = f"pay_wh_{uuid.uuid4().hex[:12]}"
    raw_payload = json.dumps({
        "event_id": event_id,
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "order_id": order["razorpay_order_id"],
                    "amount": 120000,
                    "currency": "INR",
                    "status": "captured",
                    "method": "upi",
                }
            }
        }
    }).encode("utf-8")

    sig = razorpay_client.generate_test_webhook_signature(raw_payload)

    wh_res = client.post(
        "/api/v1/payments/webhook",
        content=raw_payload,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": sig}
    )
    assert wh_res.status_code == 200
    assert wh_res.json()["status"] == "processed"

    # Verify order status in DB
    order_data = client.get(f"/api/v1/payments/orders/{order['internal_order_id']}").json()
    assert order_data["status"] == "paid"


def test_invalid_webhook_signature_rejected():
    """Webhook with bad signature is rejected with 400 INVALID_WEBHOOK_SIGNATURE."""
    raw_payload = b'{"event": "payment.captured"}'
    wh_res = client.post(
        "/api/v1/payments/webhook",
        content=raw_payload,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": "invalid_sig_12345"}
    )
    assert wh_res.status_code == 400
    assert wh_res.json()["detail"]["code"] == "INVALID_WEBHOOK_SIGNATURE"


def test_missing_webhook_signature_rejected():
    """Webhook without signature header is rejected with 400 MISSING_SIGNATURE."""
    raw_payload = b'{"event": "payment.captured"}'
    wh_res = client.post(
        "/api/v1/payments/webhook",
        content=raw_payload,
        headers={"Content-Type": "application/json"}
    )
    assert wh_res.status_code == 400
    assert wh_res.json()["detail"]["code"] == "MISSING_SIGNATURE"


def test_duplicate_webhook_delivery_is_idempotent(test_session_id):
    """Submitting the exact same webhook payload twice returns duplicate on second run."""
    event_id = f"event_{uuid.uuid4().hex[:12]}"
    raw_payload = json.dumps({
        "event_id": event_id,
        "event": "order.paid",
        "payload": {
            "order": {
                "entity": {
                    "id": f"order_wh_{uuid.uuid4().hex[:8]}",
                    "amount": 50000,
                    "currency": "INR",
                    "status": "paid",
                }
            }
        }
    }).encode("utf-8")

    sig = razorpay_client.generate_test_webhook_signature(raw_payload)

    res1 = client.post(
        "/api/v1/payments/webhook",
        content=raw_payload,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": sig}
    )
    res2 = client.post(
        "/api/v1/payments/webhook",
        content=raw_payload,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": sig}
    )

    assert res1.status_code == 200
    assert res1.json()["status"] == "processed"
    assert res2.status_code == 200
    assert res2.json()["status"] == "duplicate"


def test_unsupported_webhook_event_ignored_safely():
    """Unsupported event types are safely marked as ignored without failing."""
    raw_payload = json.dumps({
        "event_id": f"event_{uuid.uuid4().hex[:12]}",
        "event": "invoice.paid",
        "payload": {}
    }).encode("utf-8")

    sig = razorpay_client.generate_test_webhook_signature(raw_payload)

    res = client.post(
        "/api/v1/payments/webhook",
        content=raw_payload,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": sig}
    )
    assert res.status_code == 200
    assert res.json()["status"] == "ignored"


def test_webhook_on_already_finalized_payment_is_safe_and_idempotent(test_session_id):
    """Webhook arriving after payment was already verified via checkout.js is handled gracefully."""
    client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1}
    )
    chk = client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": True}
    ).json()
    order = client.post(
        f"/api/v1/payments/orders?session_id={test_session_id}",
        json={"checkout_id": chk["id"]}
    ).json()

    # 1. Frontend verify verifies first
    payment_id = f"pay_prior_{uuid.uuid4().hex[:12]}"
    sig = razorpay_client.generate_test_signature(
        razorpay_order_id=order["razorpay_order_id"],
        razorpay_payment_id=payment_id,
    )
    client.post(
        "/api/v1/payments/verify",
        json={
            "internal_order_id": order["internal_order_id"],
            "razorpay_order_id": order["razorpay_order_id"],
            "razorpay_payment_id": payment_id,
            "razorpay_signature": sig,
        }
    )

    # 2. Subsequent webhook arriving later with payment.captured
    raw_payload = json.dumps({
        "event_id": f"event_{uuid.uuid4().hex[:12]}",
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "order_id": order["razorpay_order_id"],
                    "amount": 149900,
                    "currency": "INR",
                    "status": "captured",
                }
            }
        }
    }).encode("utf-8")
    wh_sig = razorpay_client.generate_test_webhook_signature(raw_payload)

    wh_res = client.post(
        "/api/v1/payments/webhook",
        content=raw_payload,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": wh_sig}
    )
    assert wh_res.status_code == 200
    assert wh_res.json()["status"] in ["processed", "duplicate"]


def test_malformed_json_webhook_rejected():
    """Webhook with invalid JSON syntax returns 400."""
    raw_payload = b'{"event": "payment.captured", invalid_json'
    sig = razorpay_client.generate_test_webhook_signature(raw_payload)

    res = client.post(
        "/api/v1/payments/webhook",
        content=raw_payload,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": sig}
    )
    assert res.status_code == 400


def test_payment_failed_webhook_records_failure_state(test_session_id):
    """payment.failed webhook transitions attempt and order to failed."""
    client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1}
    )
    chk = client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": True}
    ).json()
    order = client.post(
        f"/api/v1/payments/orders?session_id={test_session_id}",
        json={"checkout_id": chk["id"]}
    ).json()

    payment_id = f"pay_fail_{uuid.uuid4().hex[:12]}"
    raw_payload = json.dumps({
        "event_id": f"event_{uuid.uuid4().hex[:12]}",
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "order_id": order["razorpay_order_id"],
                    "amount": 149900,
                    "currency": "INR",
                    "status": "failed",
                    "error_code": "BAD_REQUEST_ERROR",
                    "error_description": "Payment was declined by issuing bank",
                }
            }
        }
    }).encode("utf-8")
    sig = razorpay_client.generate_test_webhook_signature(raw_payload)

    res = client.post(
        "/api/v1/payments/webhook",
        content=raw_payload,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": sig}
    )
    assert res.status_code == 200
    assert res.json()["status"] == "processed"

    # Verify order state
    order_data = client.get(f"/api/v1/payments/orders/{order['internal_order_id']}").json()
    assert order_data["status"] == "failed"


def test_merchant_audit_trail_recorded_and_filterable(test_session_id):
    """Audit events are created across checkout, order, and capture, and can be queried with filters."""
    client.post(
        f"/api/v1/cart/{test_session_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1}
    )
    chk = client.post(
        f"/api/v1/checkout/confirm?session_id={test_session_id}",
        json={"buyer_confirmed": True}
    ).json()
    order = client.post(
        f"/api/v1/payments/orders?session_id={test_session_id}",
        json={"checkout_id": chk["id"]}
    ).json()

    payment_id = f"pay_test_{uuid.uuid4().hex[:12]}"
    sig = razorpay_client.generate_test_signature(
        razorpay_order_id=order["razorpay_order_id"],
        razorpay_payment_id=payment_id,
    )
    client.post(
        "/api/v1/payments/verify",
        json={
            "internal_order_id": order["internal_order_id"],
            "razorpay_order_id": order["razorpay_order_id"],
            "razorpay_payment_id": payment_id,
            "razorpay_signature": sig,
        }
    )

    # Query merchant audit trail
    audit_res = client.get(f"/api/v1/payments/audit?session_id={test_session_id}")
    assert audit_res.status_code == 200
    data = audit_res.json()
    assert data["total_events"] >= 3

    event_types = [e["event_type"] for e in data["events"]]
    assert "CHECKOUT_INITIATED" in event_types
    assert "BUYER_CONFIRMED" in event_types
    assert "ORDER_CREATED" in event_types
    assert "PAYMENT_CAPTURED" in event_types


def test_merchant_audit_redacts_sensitive_keys(test_session_id):
    """Audit event metadata must never contain secrets, keys, or passwords."""
    audit_res = client.get("/api/v1/payments/audit?limit=100")
    assert audit_res.status_code == 200

    sensitive_tokens = ["secret", "password", "signature", "key"]
    for event in audit_res.json()["events"]:
        meta = event.get("metadata_json") or {}
        for k, v in meta.items():
            if any(tok in k.lower() for tok in sensitive_tokens):
                assert v == "[REDACTED]", f"Sensitive key '{k}' was not redacted in audit log!"
