"""
Unit and integration tests for Request Correlation IDs (X-Request-ID) and Rate Limiting.
"""
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.middleware.rate_limit import limiter
from app.db.session import SessionLocal
from app.models.payment import AuditEvent

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_limiter():
    """Reset rate limiter state before each test."""
    limiter.reset()
    yield
    limiter.reset()


def test_correlation_id_generated_when_missing():
    """Requests without X-Request-ID receive a generated identifier."""
    res = client.get("/health")
    assert res.status_code == 200
    assert "X-Request-ID" in res.headers
    cid = res.headers["X-Request-ID"]
    assert cid.startswith("req_")


def test_correlation_id_propagated_when_provided():
    """Client-provided X-Request-ID is preserved and echoed back."""
    custom_cid = f"client-trace-{uuid.uuid4().hex[:8]}"
    res = client.get("/health", headers={"X-Request-ID": custom_cid})
    assert res.status_code == 200
    assert res.headers.get("X-Request-ID") == custom_cid


def test_correlation_id_attached_to_audit_events():
    """Audit events automatically include the active correlation ID in metadata."""
    custom_cid = f"trace-audit-{uuid.uuid4().hex[:8]}"
    sess_id = f"corr_sess_{uuid.uuid4().hex[:8]}"

    # Add item and confirm checkout with correlation ID
    client.post(
        f"/api/v1/cart/{sess_id}/items",
        json={"product_id": "prod_mouse_01", "quantity": 1},
        headers={"X-Request-ID": custom_cid, "X-Session-ID": sess_id}
    )

    confirm_res = client.post(
        f"/api/v1/checkout/confirm?session_id={sess_id}",
        json={"buyer_confirmed": True},
        headers={"X-Request-ID": custom_cid, "X-Session-ID": sess_id}
    )
    assert confirm_res.status_code == 200
    assert confirm_res.headers.get("X-Request-ID") == custom_cid

    # Verify audit event has correlation_id
    db = SessionLocal()
    try:
        event = db.query(AuditEvent).filter(
            AuditEvent.session_id == sess_id,
            AuditEvent.event_type == "BUYER_CONFIRMED"
        ).first()
        assert event is not None
        assert event.metadata_json is not None
        assert event.metadata_json.get("correlation_id") == custom_cid
    finally:
        db.close()


def test_rate_limiting_enforced_on_sensitive_order_creation():
    """Exceeding rate limit on POST /api/v1/payments/orders returns HTTP 429."""
    sess_id = f"ratelimit_sess_{uuid.uuid4().hex[:8]}"

    # Make 21 rapid requests to POST /api/v1/payments/orders (limit is 20)
    hit_429 = False
    retry_header = None

    for i in range(25):
        res = client.post(
            f"/api/v1/payments/orders?session_id={sess_id}",
            json={"checkout_id": "fake_checkout_id"},
            headers={"X-Session-ID": sess_id}
        )
        if res.status_code == 429:
            hit_429 = True
            retry_header = res.headers.get("Retry-After")
            assert res.json()["detail"]["code"] == "RATE_LIMIT_EXCEEDED"
            break

    assert hit_429 is True
    assert retry_header is not None


def test_rate_limiting_exempts_general_catalog_and_health():
    """General endpoints like /health and /api/v1/products are not throttled by sensitive limits."""
    for _ in range(35):
        res = client.get("/health")
        assert res.status_code == 200


def test_rate_limiting_is_isolated_between_different_sessions():
    """Rate limits for one session do not penalize independent sessions."""
    sess_a = f"sess_a_{uuid.uuid4().hex[:8]}"
    sess_b = f"sess_b_{uuid.uuid4().hex[:8]}"

    # Max out session A
    for _ in range(22):
        client.post(
            f"/api/v1/payments/orders?session_id={sess_a}",
            json={"checkout_id": "dummy"},
            headers={"X-Session-ID": sess_a}
        )

    # Session A should now be throttled
    res_a = client.post(
        f"/api/v1/payments/orders?session_id={sess_a}",
        json={"checkout_id": "dummy"},
        headers={"X-Session-ID": sess_a}
    )
    assert res_a.status_code == 429

    # Session B should NOT be throttled
    res_b = client.post(
        f"/api/v1/payments/orders?session_id={sess_b}",
        json={"checkout_id": "dummy"},
        headers={"X-Session-ID": sess_b}
    )
    # Status code will be 400 (due to invalid dummy checkout), but NOT 429
    assert res_b.status_code != 429
