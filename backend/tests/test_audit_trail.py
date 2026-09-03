"""
Unit and Integration Tests for Milestone 7: Immutable Audit Trail and Failure Handling.
Verifies append-only immutability, recursive metadata sanitization, event coverage,
correlation ID propagation, idempotency, failure recovery metadata, and merchant timeline filtering.
"""
import uuid
import pytest
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.models.payment import AuditEvent
from app.services.audit_service import (
    AuditService,
    AuditImmutabilityError,
    sanitize_audit_metadata,
)
from app.schemas.audit import AuditEventType, AuditActorType, AuditEventStatus
from app.services.cart_service import CartService
from app.services.policy_service import PolicyService
from app.services.checkout_service import CheckoutService
from app.services.payment_service import PaymentService
from app.services.payment_verification_service import PaymentVerificationService
from app.services.webhook_service import WebhookService
from app.services.razorpay_client import razorpay_client

client = TestClient(app)


@pytest.fixture
def db_session():
    """Isolated database session for unit testing."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


# ==============================================================================
# 1. AUDIT IMMUTABILITY TESTS
# ==============================================================================

def test_audit_event_creation_and_fields(db_session: Session):
    """Test that audit events are properly persisted with all metadata fields."""
    session_id = f"sess_audit_{uuid.uuid4().hex[:8]}"
    corr_id = f"req_{uuid.uuid4().hex[:8]}"

    event = AuditService.log_event(
        db=db_session,
        actor_type="BUYER",
        session_id=session_id,
        event_type=AuditEventType.CART_CREATED.value,
        event_status="succeeded",
        correlation_id=corr_id,
        reason_code="USER_INITIATED",
        recovery_action="NONE",
        metadata={"test_param": "test_val"},
    )

    assert event.id is not None
    assert event.actor_type == "BUYER"
    assert event.session_id == session_id
    assert event.event_type == AuditEventType.CART_CREATED.value
    assert event.event_status == "succeeded"
    assert event.correlation_id == corr_id
    assert event.reason_code == "USER_INITIATED"
    assert event.metadata_json == {"test_param": "test_val", "correlation_id": corr_id}


def test_audit_event_orm_update_prevented(db_session: Session):
    """Test that modifying an AuditEvent via ORM raises AuditImmutabilityError."""
    session_id = f"sess_audit_{uuid.uuid4().hex[:8]}"
    event = AuditService.log_event(
        db=db_session,
        actor_type="SYSTEM",
        session_id=session_id,
        event_type="TEST_EVENT",
        event_status="attempted",
    )

    event.event_status = "succeeded"
    with pytest.raises(AuditImmutabilityError, match="cannot be updated"):
        db_session.commit()
    db_session.rollback()


def test_audit_event_orm_delete_prevented(db_session: Session):
    """Test that deleting an AuditEvent via ORM raises AuditImmutabilityError."""
    session_id = f"sess_audit_{uuid.uuid4().hex[:8]}"
    event = AuditService.log_event(
        db=db_session,
        actor_type="SYSTEM",
        session_id=session_id,
        event_type="TEST_EVENT_DELETE",
        event_status="attempted",
    )

    db_session.delete(event)
    with pytest.raises(AuditImmutabilityError, match="cannot be deleted"):
        db_session.commit()
    db_session.rollback()


def test_audit_event_sql_trigger_prevents_update(db_session: Session):
    """Test that direct raw SQL UPDATE is blocked by the PostgreSQL trigger."""
    session_id = f"sess_audit_{uuid.uuid4().hex[:8]}"
    event = AuditService.log_event(
        db=db_session,
        actor_type="SYSTEM",
        session_id=session_id,
        event_type="TEST_RAW_SQL",
        event_status="succeeded",
    )

    with pytest.raises(Exception, match="append-only"):
        db_session.execute(
            text("UPDATE audit_events SET event_status = 'tampered' WHERE id = :id"),
            {"id": event.id},
        )
        db_session.commit()
    db_session.rollback()


def test_audit_event_sql_trigger_prevents_delete(db_session: Session):
    """Test that direct raw SQL DELETE is blocked by the PostgreSQL trigger."""
    session_id = f"sess_audit_{uuid.uuid4().hex[:8]}"
    event = AuditService.log_event(
        db=db_session,
        actor_type="SYSTEM",
        session_id=session_id,
        event_type="TEST_RAW_DELETE",
        event_status="succeeded",
    )

    with pytest.raises(Exception, match="append-only"):
        db_session.execute(
            text("DELETE FROM audit_events WHERE id = :id"),
            {"id": event.id},
        )
        db_session.commit()
    db_session.rollback()


# ==============================================================================
# 2. AUDIT SANITIZATION TESTS
# ==============================================================================

def test_sanitize_audit_metadata_redaction():
    """Verify recursive sanitization strips all sensitive keys, tokens, and cards."""
    dirty_payload = {
        "user_id": "usr_123",
        "api_key": "live_secret_key_abcdef",
        "razorpay_secret": "rzp_sec_xyz",
        "nested": {
            "password": "super_secret_password",
            "cvv": "123",
            "card_number": "4111111111111234",
            "token": "tok_jwt_abc123",
            "safe_value": 42,
        },
        "tags": ["normal", "auth_token_val"],
        "authorization_header": "Bearer secret_jwt_token_here",
    }

    cleaned = sanitize_audit_metadata(dirty_payload)

    assert cleaned["user_id"] == "usr_123"
    assert cleaned["api_key"] == "[REDACTED]"
    assert cleaned["razorpay_secret"] == "[REDACTED]"
    assert cleaned["nested"]["password"] == "[REDACTED]"
    assert cleaned["nested"]["cvv"] == "[REDACTED]"
    assert cleaned["nested"]["card_number"] == "[REDACTED]"
    assert cleaned["nested"]["token"] == "[REDACTED]"
    assert cleaned["nested"]["safe_value"] == 42
    assert cleaned["authorization_header"] == "[REDACTED]"


# ==============================================================================
# 3. CORRELATION AND LIFECYCLE LINKING TESTS
# ==============================================================================

def test_correlation_id_continuity_in_audit(db_session: Session):
    """Test that events across the lifecycle retain correlation IDs."""
    corr_id = f"req_trace_{uuid.uuid4().hex[:8]}"
    session_id = f"sess_corr_{uuid.uuid4().hex[:8]}"

    # Event 1: Cart created
    e1 = AuditService.log_event(
        db=db_session,
        actor_type="BUYER",
        session_id=session_id,
        event_type=AuditEventType.CART_CREATED.value,
        correlation_id=corr_id,
    )

    # Event 2: Policy evaluated
    e2 = AuditService.log_event(
        db=db_session,
        actor_type="SYSTEM",
        session_id=session_id,
        event_type=AuditEventType.POLICY_EVALUATED.value,
        correlation_id=corr_id,
        parent_event_id=e1.id,
    )

    # Event 3: Order created
    e3 = AuditService.log_event(
        db=db_session,
        actor_type="SYSTEM",
        session_id=session_id,
        event_type=AuditEventType.PAYMENT_ORDER_CREATED.value,
        correlation_id=corr_id,
        parent_event_id=e2.id,
    )

    trail = AuditService.get_audit_trail(db=db_session, correlation_id=corr_id)
    assert len(trail) >= 3
    event_types = [e.event_type for e in trail]
    assert AuditEventType.CART_CREATED.value in event_types
    assert AuditEventType.POLICY_EVALUATED.value in event_types
    assert AuditEventType.PAYMENT_ORDER_CREATED.value in event_types
    assert all(e.correlation_id == corr_id for e in trail)


# ==============================================================================
# 4. IDEMPOTENT AUDIT RECORDING TESTS
# ==============================================================================

def test_idempotent_audit_logging_with_key(db_session: Session):
    """Test that logging with an existing idempotency_key returns existing record without error."""
    session_id = f"sess_idem_{uuid.uuid4().hex[:8]}"
    idem_key = f"wh_evt_{uuid.uuid4().hex[:12]}"

    e1 = AuditService.log_event(
        db=db_session,
        actor_type="WEBHOOK",
        session_id=session_id,
        event_type=AuditEventType.WEBHOOK_PROCESSED.value,
        idempotency_key=idem_key,
        metadata={"delivery_count": 1},
    )

    # Repeat with same key
    e2 = AuditService.log_event(
        db=db_session,
        actor_type="WEBHOOK",
        session_id=session_id,
        event_type=AuditEventType.WEBHOOK_PROCESSED.value,
        idempotency_key=idem_key,
        metadata={"delivery_count": 2},
    )

    assert e1.id == e2.id


# ==============================================================================
# 5. MERCHANT TIMELINE API TESTS
# ==============================================================================

def test_merchant_audit_timeline_api_filters(db_session: Session):
    """Test GET /api/v1/payments/audit endpoint with multi-parameter filtering."""
    test_sess = f"sess_timeline_{uuid.uuid4().hex[:8]}"
    test_order = f"ord_timeline_{uuid.uuid4().hex[:8]}"

    AuditService.log_event(
        db=db_session,
        actor_type="BUYER",
        session_id=test_sess,
        event_type=AuditEventType.CART_ITEM_ADDED.value,
        product_id="DK-LP-15",
    )
    AuditService.log_event(
        db=db_session,
        actor_type="SYSTEM",
        session_id=test_sess,
        order_id=test_order,
        event_type=AuditEventType.PAYMENT_ORDER_CREATED.value,
    )

    # 1. Filter by session_id
    res1 = client.get(f"/api/v1/payments/audit?session_id={test_sess}")
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["total_events"] >= 2

    # 2. Filter by order_id
    res2 = client.get(f"/api/v1/payments/audit?order_id={test_order}")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["total_events"] >= 1
    assert data2["events"][0]["order_id"] == test_order

    # 3. Filter by event_type
    res3 = client.get(f"/api/v1/payments/audit?session_id={test_sess}&event_type={AuditEventType.CART_ITEM_ADDED.value}")
    assert res3.status_code == 200
    data3 = res3.json()
    assert data3["total_events"] == 1
    assert data3["events"][0]["event_type"] == AuditEventType.CART_ITEM_ADDED.value


# ==============================================================================
# 6. FAILURE AND RECOVERY METADATA TESTS
# ==============================================================================

def test_payment_failure_and_cancellation_metadata(db_session: Session):
    """Test that cancellation and failure states capture structured codes and recovery actions."""
    session_id = f"sess_fail_{uuid.uuid4().hex[:8]}"

    # Add item and checkout
    CartService.add_item(db_session, session_id, "DK-MS-05", 1)
    checkout = CheckoutService.create_or_get_checkout(db_session, session_id)
    CheckoutService.confirm_buyer_authorization(db_session, checkout.id, session_id, True)
    order = PaymentService.create_payment_order(db_session, checkout.id, session_id)

    # 1. Test Cancellation
    cancelled = PaymentService.cancel_payment_order(
        db=db_session,
        order_id=order.id,
        session_id=session_id,
        reason="buyer_dismissed_checkout",
        failure_code=None,
        failure_description="Buyer closed the payment window.",
    )

    assert cancelled.status == "cancelled"

    # Verify cancellation audit event
    trail_cancel = AuditService.get_audit_trail(db=db_session, order_id=order.id, event_type="PAYMENT_CANCELLED")
    assert len(trail_cancel) >= 1
    ev_cancel = trail_cancel[0]
    assert ev_cancel.recovery_action == "RETRY_PAYMENT"
    assert ev_cancel.reason_code == "buyer_dismissed_checkout"

    # 2. Test Failure on a second order
    session_id_2 = f"sess_fail2_{uuid.uuid4().hex[:8]}"
    CartService.add_item(db_session, session_id_2, "DK-MS-05", 1)
    chk2 = CheckoutService.create_or_get_checkout(db_session, session_id_2)
    CheckoutService.confirm_buyer_authorization(db_session, chk2.id, session_id_2, True)
    ord2 = PaymentService.create_payment_order(db_session, chk2.id, session_id_2)

    failed = PaymentService.cancel_payment_order(
        db=db_session,
        order_id=ord2.id,
        session_id=session_id_2,
        reason="payment_failed_at_bank",
        failure_code="GATEWAY_ERROR",
        failure_description="Card declined by issuing bank.",
    )

    assert failed.status == "failed"
    trail_fail = AuditService.get_audit_trail(db=db_session, order_id=ord2.id, event_type="PAYMENT_FAILED")
    assert len(trail_fail) >= 1
    ev_fail = trail_fail[0]
    assert ev_fail.event_status == "failed"
    assert ev_fail.failure_code == "GATEWAY_ERROR"
    assert ev_fail.recovery_action == "RETRY_PAYMENT"
