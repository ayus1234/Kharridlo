import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import (
    Column,
    String,
    BigInteger,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    JSON,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

DEFAULT_CHECKOUT_TTL_MINUTES = 30


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_default_checkout_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=DEFAULT_CHECKOUT_TTL_MINUTES)


class CheckoutSession(Base):
    """
    Authoritative checkout state machine session.
    Tracks cart snapshot, policy gating, buyer authorization, and payment lifecycle.
    """
    __tablename__ = "checkout_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    session_id = Column(String(64), index=True, nullable=False)
    cart_id = Column(String(36), ForeignKey("carts.id", ondelete="CASCADE"), index=True, nullable=False)
    subtotal_paise = Column(BigInteger, default=0, nullable=False)
    total_paise = Column(BigInteger, default=0, nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    policy_tier = Column(String(32), default="STANDARD", nullable=False)
    policy_decision = Column(String(32), default="AUTHORIZATION_REQUIRED", nullable=False)
    buyer_confirmed = Column(Boolean, default=False, nullable=False)
    buyer_confirmed_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(32), default="CART_REVIEW", index=True, nullable=False)
    cart_snapshot = Column(JSON, nullable=True)
    expires_at = Column(DateTime(timezone=True), default=get_default_checkout_expiry, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    cart = relationship("Cart")
    orders = relationship("PaymentOrder", back_populates="checkout", cascade="all, delete-orphan", order_by="PaymentOrder.created_at.desc()")

    @property
    def is_expired(self) -> bool:
        now = datetime.now(timezone.utc)
        expires = self.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        return now > expires


class PaymentOrder(Base):
    """
    Server-created Razorpay order record mapping internal order ID to external Razorpay order ID.
    Enforces integer paise amounts, unique receipts, and idempotency.
    """
    __tablename__ = "payment_orders"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    checkout_id = Column(String(36), ForeignKey("checkout_sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    session_id = Column(String(64), index=True, nullable=False)
    razorpay_order_id = Column(String(64), unique=True, index=True, nullable=False)
    amount_paise = Column(BigInteger, nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    receipt = Column(String(64), unique=True, index=True, nullable=False)
    status = Column(String(32), default="created", index=True, nullable=False)  # created, attempted, paid, failed, cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    checkout = relationship("CheckoutSession", back_populates="orders")
    attempts = relationship("PaymentAttempt", back_populates="order", cascade="all, delete-orphan", order_by="PaymentAttempt.created_at.desc()")


class PaymentAttempt(Base):
    """
    Individual payment transaction attempt created when Razorpay Checkout is completed or fails.
    Tracks signature verification status and authoritative capture state.
    """
    __tablename__ = "payment_attempts"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    order_id = Column(String(36), ForeignKey("payment_orders.id", ondelete="CASCADE"), index=True, nullable=False)
    razorpay_order_id = Column(String(64), index=True, nullable=False)
    razorpay_payment_id = Column(String(64), unique=True, index=True, nullable=False)
    amount_paise = Column(BigInteger, nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    method = Column(String(32), nullable=True)  # card, upi, netbanking, wallet
    status = Column(String(32), default="CREATED", index=True, nullable=False)  # CREATED, AUTHORIZED, CAPTURED, FAILED, CANCELLED, REFUNDED, UNKNOWN
    failure_code = Column(String(64), nullable=True)
    failure_description = Column(Text, nullable=True)
    signature_verified = Column(Boolean, default=False, nullable=False)
    captured_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    order = relationship("PaymentOrder", back_populates="attempts")


class WebhookEvent(Base):
    """
    Deduplicated incoming Razorpay webhook delivery log.
    Enforces idempotent webhook handling via razorpay_event_id and raw payload hash.
    """
    __tablename__ = "webhook_events"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    razorpay_event_id = Column(String(64), unique=True, index=True, nullable=True)
    payload_hash = Column(String(64), unique=True, index=True, nullable=False)
    event_type = Column(String(64), index=True, nullable=False)
    processing_status = Column(String(32), default="PENDING", index=True, nullable=False)  # PENDING, PROCESSED, DUPLICATE, IGNORED, FAILED
    failure_reason = Column(Text, nullable=True)
    received_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    processed_at = Column(DateTime(timezone=True), nullable=True)


class AuditEvent(Base):
    """
    Merchant audit log recording all governance, checkout, payment, and webhook lifecycle events.
    Guaranteed to contain zero secrets, API keys, or raw authentication payloads.
    """
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    actor_type = Column(String(32), index=True, nullable=False)  # BUYER, SYSTEM, MERCHANT, WEBHOOK, RAZORPAY
    session_id = Column(String(64), index=True, nullable=False)
    event_type = Column(String(64), index=True, nullable=False)
    checkout_id = Column(String(36), index=True, nullable=True)
    order_id = Column(String(36), index=True, nullable=True)
    razorpay_order_id = Column(String(64), index=True, nullable=True)
    razorpay_payment_id = Column(String(64), index=True, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
