"""
Phase 4 End-to-End Test Suite: Agentic Cart & Checkout Execution
Validates:
1. Conversational cart mutations (Add, Update Quantity, Remove, Clear)
2. Quantity parsing with SKU protection ("Add DK-LP-15 to my cart" -> quantity 1, not 15)
3. Word numbers ("make it two", "make it 3")
4. Cart total inquiries with exact paise arithmetic
5. Policy evaluation attached dynamically to cart updates
6. Checkout readiness intent leading to /checkout/authorize and clarifying "Payment has not been initiated"
7. Strict Zero AI Payment Authority boundary
"""
import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.agent.tools import BOUNDED_TOOLS

client = TestClient(app)


@pytest.fixture(autouse=True)
def deterministic_agent_mode():
    orig_key = settings.GEMINI_API_KEY
    settings.GEMINI_API_KEY = ""
    yield
    settings.GEMINI_API_KEY = orig_key


@pytest.fixture
def p4_session():
    return f"p4_sess_{uuid.uuid4().hex[:12]}"


def test_zero_payment_authority_invariant():
    """Invariant: The AI agent registry must contain strictly zero payment tools."""
    payment_forbidden = ["pay", "create_order", "razorpay", "authorize_payment", "charge", "refund"]
    for tool_name in BOUNDED_TOOLS:
        assert not any(f in tool_name for f in payment_forbidden), f"Forbidden tool {tool_name} found in agent tools!"
    assert len(BOUNDED_TOOLS) == 7


def test_conversational_add_sku_protects_against_sku_quantity_collision(p4_session):
    """
    Bugfix regression test: "Add DK-LP-15 to my cart" contains '15'.
    The parser must NOT interpret '15' as quantity! It should add 1 unit.
    """
    res = client.post(
        "/api/v1/agent/chat",
        headers={"X-Session-ID": p4_session},
        json={"message": "Add DK-LP-15 to my cart", "session_id": p4_session},
    )
    assert res.status_code == 200
    data = res.json()
    assert "added" in data["message"].lower()
    assert "DK-LP-15" in data["message"]

    # Verify authoritative cart has quantity 1
    cart_res = client.get(f"/api/v1/cart/{p4_session}", headers={"X-Session-ID": p4_session})
    assert cart_res.status_code == 200
    cart = cart_res.json()
    assert len(cart["items"]) == 1
    assert cart["items"][0]["quantity"] == 1
    assert cart["total_items_count"] == 1


def test_conversational_quantity_update_number_and_words(p4_session):
    """Test updating cart quantity conversationally using both digits and words."""
    # Step 1: Add DK-KB-02 (Mechanical Keyboard)
    client.post(
        "/api/v1/agent/chat",
        headers={"X-Session-ID": p4_session},
        json={"message": "Add DK-KB-02 to my cart", "session_id": p4_session},
    )

    # Step 2: Change quantity to 3
    res_qty3 = client.post(
        "/api/v1/agent/chat",
        headers={"X-Session-ID": p4_session},
        json={"message": "change quantity to 3", "session_id": p4_session},
    )
    assert res_qty3.status_code == 200
    assert "3" in res_qty3.json()["message"]

    cart_res = client.get(f"/api/v1/cart/{p4_session}", headers={"X-Session-ID": p4_session})
    assert cart_res.json()["items"][0]["quantity"] == 3

    # Step 3: Change quantity using word "make it two"
    res_qty2 = client.post(
        "/api/v1/agent/chat",
        headers={"X-Session-ID": p4_session},
        json={"message": "make it two", "session_id": p4_session},
    )
    assert res_qty2.status_code == 200

    cart_res2 = client.get(f"/api/v1/cart/{p4_session}", headers={"X-Session-ID": p4_session})
    assert cart_res2.json()["items"][0]["quantity"] == 2


def test_conversational_cart_total_inquiry(p4_session):
    """Test asking the agent for the authoritative cart total."""
    # Add an item
    client.post(
        "/api/v1/agent/chat",
        headers={"X-Session-ID": p4_session},
        json={"message": "Add DK-MS-01 to my cart", "session_id": p4_session},
    )

    res = client.post(
        "/api/v1/agent/chat",
        headers={"X-Session-ID": p4_session},
        json={"message": "What is my cart total?", "session_id": p4_session},
    )
    assert res.status_code == 200
    data = res.json()
    assert "total" in data["message"].lower()
    assert "paise" in data["message"]


def test_conversational_removal_and_clear(p4_session):
    """Test removing items conversationally and clearing cart."""
    # Add two items
    client.post(
        "/api/v1/agent/chat",
        headers={"X-Session-ID": p4_session},
        json={"message": "Add DK-LP-15 to my cart", "session_id": p4_session},
    )
    client.post(
        "/api/v1/agent/chat",
        headers={"X-Session-ID": p4_session},
        json={"message": "Add DK-MS-01 to my cart", "session_id": p4_session},
    )

    # Remove mouse
    res_remove = client.post(
        "/api/v1/agent/chat",
        headers={"X-Session-ID": p4_session},
        json={"message": "remove the mouse", "session_id": p4_session},
    )
    assert res_remove.status_code == 200
    assert "removed" in res_remove.json()["message"].lower()

    # Clear cart
    res_clear = client.post(
        "/api/v1/agent/chat",
        headers={"X-Session-ID": p4_session},
        json={"message": "clear my cart", "session_id": p4_session},
    )
    assert res_clear.status_code == 200
    assert "cleared" in res_clear.json()["message"].lower()

    cart_res = client.get(f"/api/v1/cart/{p4_session}", headers={"X-Session-ID": p4_session})
    assert len(cart_res.json()["items"]) == 0


def test_checkout_readiness_mandates_payment_not_initiated(p4_session):
    """
    Test checkout readiness intent ("ready to checkout"):
    1. Directs to /checkout/authorize
    2. Mandates: 'Payment has not been initiated.'
    3. Evaluates spending policy
    """
    # Add product under limit
    client.post(
        "/api/v1/agent/chat",
        headers={"X-Session-ID": p4_session},
        json={"message": "Add DK-LP-15 to my cart", "session_id": p4_session},
    )

    res = client.post(
        "/api/v1/agent/chat",
        headers={"X-Session-ID": p4_session},
        json={"message": "I am ready to checkout", "session_id": p4_session},
    )
    assert res.status_code == 200
    reply = res.json()["message"]

    assert "/checkout/authorize" in reply
    assert "Payment has not been initiated" in reply
    assert "authorize" in reply.lower()


def test_checkout_readiness_blocks_when_policy_exceeded(p4_session):
    """When cart total exceeds limit, checkout readiness reports policy BLOCK."""
    # Add DK-LP-ULTRA (₹1,49,000 > ₹70,000 standard limit)
    client.post(
        "/api/v1/agent/chat",
        headers={"X-Session-ID": p4_session},
        json={"message": "Add DK-LP-ULTRA to my cart", "session_id": p4_session},
    )

    res = client.post(
        "/api/v1/agent/chat",
        headers={"X-Session-ID": p4_session},
        json={"message": "proceed to checkout", "session_id": p4_session},
    )
    assert res.status_code == 200
    reply = res.json()["message"]
    assert "exceeds" in reply.lower() or "blocked" in reply.lower()
    assert "Payment has not been initiated" in reply
