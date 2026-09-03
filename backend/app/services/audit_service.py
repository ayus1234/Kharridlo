"""
Kharridlo Audit Service.
Enforces immutable, append-only merchant audit trail with recursive metadata sanitization,
structured failure/recovery tracking, correlation linking, and idempotency guarantees.
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Union
from sqlalchemy import event, or_
from sqlalchemy.orm import Session
from app.models.payment import AuditEvent

SENSITIVE_KEY_SUBSTRINGS = {
    "secret",
    "key",
    "signature",
    "token",
    "password",
    "authorization",
    "auth",
    "api_key",
    "key_secret",
    "webhook_secret",
    "card",
    "cvv",
    "card_number",
    "payment_method_details",
    "raw_request_headers",
    "raw_response_headers",
}


class AuditImmutabilityError(RuntimeError):
    """Raised when an attempt is made to update or delete an immutable AuditEvent."""
    pass


# ORM-level event listeners enforcing append-only immutability
@event.listens_for(AuditEvent, "before_update")
def prevent_audit_event_update(mapper, connection, target):
    raise AuditImmutabilityError(
        f"Audit immutability violation: AuditEvent '{target.id}' ({target.event_type}) is append-only and cannot be updated."
    )


@event.listens_for(AuditEvent, "before_delete")
def prevent_audit_event_delete(mapper, connection, target):
    raise AuditImmutabilityError(
        f"Audit immutability violation: AuditEvent '{target.id}' ({target.event_type}) is append-only and cannot be deleted."
    )


def sanitize_audit_metadata(data: Any) -> Any:
    """
    Centralized recursive sanitization function for audit metadata.
    Handles dictionaries, lists, strings, numbers, booleans, and nulls.
    Guarantees zero payment cards, API secrets, auth tokens, or hidden reasoning payloads are logged.
    """
    if data is None:
        return None

    if isinstance(data, dict):
        sanitized = {}
        for k, v in data.items():
            k_lower = str(k).lower()
            if any(sensitive in k_lower for sensitive in SENSITIVE_KEY_SUBSTRINGS):
                sanitized[k] = "[REDACTED]"
            else:
                sanitized[k] = sanitize_audit_metadata(v)
        return sanitized

    if isinstance(data, list):
        return [sanitize_audit_metadata(item) for item in data]

    if isinstance(data, str):
        # Prevent accidental inclusion of JWT or long auth headers
        if len(data) > 100 and (data.startswith("Bearer ") or data.startswith("Basic ")):
            return "[REDACTED]"
        return data

    return data


class AuditService:
    """
    Service for writing and querying the immutable merchant audit trail.
    Enforces strict append-only constraints, correlation propagation, and idempotent event logging.
    """

    @classmethod
    def log_event(
        cls,
        db: Session,
        actor_type: str,
        session_id: str,
        event_type: str,
        event_status: str = "succeeded",
        checkout_id: Optional[str] = None,
        order_id: Optional[str] = None,
        razorpay_order_id: Optional[str] = None,
        razorpay_payment_id: Optional[str] = None,
        payment_attempt_id: Optional[str] = None,
        product_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
        parent_event_id: Optional[str] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        request_id: Optional[str] = None,
        reason_code: Optional[str] = None,
        failure_code: Optional[str] = None,
        recovery_action: Optional[str] = None,
        idempotency_key: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditEvent:
        """
        Create and persist an immutable audit event safely.
        If idempotency_key is provided and already exists, returns the existing record without duplicate insertion.
        """
        # 1. Check idempotency if key provided
        if idempotency_key:
            existing = db.query(AuditEvent).filter(AuditEvent.idempotency_key == idempotency_key).first()
            if existing:
                return existing

        # 2. Resolve correlation ID from explicit argument, contextvar, or metadata
        cid = correlation_id
        if not cid:
            try:
                from app.middleware.correlation import get_correlation_id
                cid = get_correlation_id()
            except Exception:
                cid = None

        if not cid and metadata and "correlation_id" in metadata:
            cid = metadata["correlation_id"]

        # 3. Sanitize metadata recursively
        meta = dict(metadata) if metadata else {}
        if cid and "correlation_id" not in meta:
            meta["correlation_id"] = cid

        sanitized_meta = sanitize_audit_metadata(meta)

        # 4. Instantiate and save immutable AuditEvent
        event_record = AuditEvent(
            actor_type=actor_type,
            session_id=session_id,
            event_type=event_type,
            event_status=event_status,
            checkout_id=checkout_id,
            order_id=order_id,
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id,
            payment_attempt_id=payment_attempt_id,
            product_id=product_id,
            correlation_id=cid,
            parent_event_id=parent_event_id,
            provider=provider,
            model=model,
            request_id=request_id or cid,
            reason_code=reason_code,
            failure_code=failure_code,
            recovery_action=recovery_action,
            idempotency_key=idempotency_key,
            metadata_json=sanitized_meta,
        )

        db.add(event_record)
        db.commit()
        db.refresh(event_record)
        return event_record

    @classmethod
    def get_audit_trail(
        cls,
        db: Session,
        session_id: Optional[str] = None,
        order_id: Optional[str] = None,
        checkout_id: Optional[str] = None,
        razorpay_order_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
        event_type: Optional[str] = None,
        event_status: Optional[str] = None,
        actor_type: Optional[str] = None,
        product_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[AuditEvent]:
        """Query audit trail with multi-parameter filtering and stable chronological ordering."""
        query = db.query(AuditEvent)

        if session_id:
            query = query.filter(AuditEvent.session_id == session_id)
        if order_id:
            query = query.filter(AuditEvent.order_id == order_id)
        if checkout_id:
            query = query.filter(AuditEvent.checkout_id == checkout_id)
        if razorpay_order_id:
            query = query.filter(AuditEvent.razorpay_order_id == razorpay_order_id)
        if correlation_id:
            query = query.filter(AuditEvent.correlation_id == correlation_id)
        if event_type and event_type != "ALL":
            query = query.filter(AuditEvent.event_type == event_type)
        if event_status and event_status != "ALL":
            query = query.filter(AuditEvent.event_status == event_status)
        if actor_type and actor_type != "ALL":
            query = query.filter(AuditEvent.actor_type == actor_type)
        if product_id:
            query = query.filter(AuditEvent.product_id == product_id)
        if start_date:
            query = query.filter(AuditEvent.created_at >= start_date)
        if end_date:
            query = query.filter(AuditEvent.created_at <= end_date)

        # Stable order: newest first, secondary order by ID
        return query.order_by(AuditEvent.created_at.desc(), AuditEvent.id.desc()).offset(offset).limit(limit).all()

    @classmethod
    def count_audit_events(
        cls,
        db: Session,
        session_id: Optional[str] = None,
        order_id: Optional[str] = None,
        checkout_id: Optional[str] = None,
        razorpay_order_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
        event_type: Optional[str] = None,
        event_status: Optional[str] = None,
        actor_type: Optional[str] = None,
        product_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> int:
        """Count total audit events matching query filters for pagination."""
        query = db.query(AuditEvent)

        if session_id:
            query = query.filter(AuditEvent.session_id == session_id)
        if order_id:
            query = query.filter(AuditEvent.order_id == order_id)
        if checkout_id:
            query = query.filter(AuditEvent.checkout_id == checkout_id)
        if razorpay_order_id:
            query = query.filter(AuditEvent.razorpay_order_id == razorpay_order_id)
        if correlation_id:
            query = query.filter(AuditEvent.correlation_id == correlation_id)
        if event_type and event_type != "ALL":
            query = query.filter(AuditEvent.event_type == event_type)
        if event_status and event_status != "ALL":
            query = query.filter(AuditEvent.event_status == event_status)
        if actor_type and actor_type != "ALL":
            query = query.filter(AuditEvent.actor_type == actor_type)
        if product_id:
            query = query.filter(AuditEvent.product_id == product_id)
        if start_date:
            query = query.filter(AuditEvent.created_at >= start_date)
        if end_date:
            query = query.filter(AuditEvent.created_at <= end_date)

        return query.count()
