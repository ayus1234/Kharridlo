from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.payment import AuditEvent

SENSITIVE_KEYS = {"secret", "key", "signature", "token", "password", "authorization", "auth", "cvv", "card_number"}


def _sanitize_metadata(metadata: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Sanitize metadata to guarantee zero secrets, signatures, or auth tokens are logged."""
    if not metadata:
        return None

    sanitized = {}
    for k, v in metadata.items():
        k_lower = k.lower()
        if any(s in k_lower for s in SENSITIVE_KEYS):
            sanitized[k] = "[REDACTED]"
        elif isinstance(v, dict):
            sanitized[k] = _sanitize_metadata(v)
        else:
            sanitized[k] = v
    return sanitized


class AuditService:
    """
    Service for writing and reading immutable merchant-facing audit events.
    Enforces security redaction of payment secrets and keys.
    """

    @classmethod
    def log_event(
        cls,
        db: Session,
        actor_type: str,
        session_id: str,
        event_type: str,
        checkout_id: Optional[str] = None,
        order_id: Optional[str] = None,
        razorpay_order_id: Optional[str] = None,
        razorpay_payment_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditEvent:
        """Create and persist an audit event safely."""
        # Automatically attach request correlation ID if available
        meta = dict(metadata) if metadata else {}
        try:
            from app.middleware.correlation import get_correlation_id
            cid = get_correlation_id()
            if cid and "correlation_id" not in meta:
                meta["correlation_id"] = cid
        except Exception:
            pass

        event = AuditEvent(
            actor_type=actor_type,
            session_id=session_id,
            event_type=event_type,
            checkout_id=checkout_id,
            order_id=order_id,
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id,
            metadata_json=_sanitize_metadata(meta),
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @classmethod
    def get_audit_trail(
        cls,
        db: Session,
        session_id: Optional[str] = None,
        order_id: Optional[str] = None,
        razorpay_order_id: Optional[str] = None,
        event_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[AuditEvent]:
        """Query audit trail with optional filtering."""
        query = db.query(AuditEvent)

        if session_id:
            query = query.filter(AuditEvent.session_id == session_id)
        if order_id:
            query = query.filter(AuditEvent.order_id == order_id)
        if razorpay_order_id:
            query = query.filter(AuditEvent.razorpay_order_id == razorpay_order_id)
        if event_type:
            query = query.filter(AuditEvent.event_type == event_type)

        return query.order_by(AuditEvent.created_at.desc()).offset(offset).limit(limit).all()

    @classmethod
    def count_audit_events(
        cls,
        db: Session,
        session_id: Optional[str] = None,
        order_id: Optional[str] = None,
        razorpay_order_id: Optional[str] = None,
        event_type: Optional[str] = None,
    ) -> int:
        """Count total audit events for pagination."""
        query = db.query(AuditEvent)
        if session_id:
            query = query.filter(AuditEvent.session_id == session_id)
        if order_id:
            query = query.filter(AuditEvent.order_id == order_id)
        if razorpay_order_id:
            query = query.filter(AuditEvent.razorpay_order_id == razorpay_order_id)
        if event_type:
            query = query.filter(AuditEvent.event_type == event_type)
        return query.count()
