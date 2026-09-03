"""
Audit Schemas and Event Taxonomy for Kharridlo.
Enforces typed enum definitions for all audit events, actors, and statuses,
along with sanitized response models for the merchant audit timeline.
"""
from enum import Enum
from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class AuditActorType(str, Enum):
    BUYER = "BUYER"
    AI = "AI"
    SYSTEM = "SYSTEM"
    MERCHANT = "MERCHANT"
    WEBHOOK = "WEBHOOK"
    PAYMENT_PROVIDER = "PAYMENT_PROVIDER"


class AuditEventStatus(str, Enum):
    ATTEMPTED = "attempted"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REJECTED = "rejected"
    RECOVERED = "recovered"
    PENDING = "pending"


class AuditEventType(str, Enum):
    # AI Lifecycle
    AI_REQUEST_STARTED = "AI_REQUEST_STARTED"
    AI_RESPONSE_GENERATED = "AI_RESPONSE_GENERATED"
    AI_TOOL_CALLED = "AI_TOOL_CALLED"
    AI_TOOL_REJECTED = "AI_TOOL_REJECTED"
    AI_PROVIDER_FAILED = "AI_PROVIDER_FAILED"
    AI_FALLBACK_USED = "AI_FALLBACK_USED"
    AI_PROMPT_INJECTION_DETECTED = "AI_PROMPT_INJECTION_DETECTED"

    # Catalog
    PRODUCT_SEARCHED = "PRODUCT_SEARCHED"
    PRODUCT_VIEWED = "PRODUCT_VIEWED"
    PRODUCT_RECOMMENDATION_GENERATED = "PRODUCT_RECOMMENDATION_GENERATED"
    PRODUCT_COMPARISON_GENERATED = "PRODUCT_COMPARISON_GENERATED"

    # Cart
    CART_CREATED = "CART_CREATED"
    CART_ITEM_ADDED = "CART_ITEM_ADDED"
    CART_ITEM_UPDATED = "CART_ITEM_UPDATED"
    CART_ITEM_REMOVED = "CART_ITEM_REMOVED"
    CART_CLEARED = "CART_CLEARED"

    # Policy & Authorization
    POLICY_EVALUATED = "POLICY_EVALUATED"
    POLICY_BLOCKED = "POLICY_BLOCKED"
    POLICY_REVALIDATED = "POLICY_REVALIDATED"
    AUTHORIZATION_REQUIRED = "AUTHORIZATION_REQUIRED"
    BUYER_AUTHORIZATION_GRANTED = "BUYER_AUTHORIZATION_GRANTED"
    BUYER_AUTHORIZATION_DENIED = "BUYER_AUTHORIZATION_DENIED"

    # Checkout
    CHECKOUT_CREATED = "CHECKOUT_CREATED"
    CHECKOUT_INITIATED = "CHECKOUT_INITIATED"
    CHECKOUT_CONFIRMED = "CHECKOUT_CONFIRMED"
    CHECKOUT_EXPIRED = "CHECKOUT_EXPIRED"
    CHECKOUT_CANCELLED = "CHECKOUT_CANCELLED"

    # Payment
    PAYMENT_ORDER_CREATED = "PAYMENT_ORDER_CREATED"
    PAYMENT_INITIATED = "PAYMENT_INITIATED"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    PAYMENT_VERIFICATION_STARTED = "PAYMENT_VERIFICATION_STARTED"
    PAYMENT_VERIFIED = "PAYMENT_VERIFIED"
    PAYMENT_CAPTURED = "PAYMENT_CAPTURED"
    PAYMENT_SUCCESS = "PAYMENT_SUCCESS"
    PAYMENT_FAILED = "PAYMENT_FAILED"
    PAYMENT_CANCELLED = "PAYMENT_CANCELLED"
    PAYMENT_RETRY_STARTED = "PAYMENT_RETRY_STARTED"
    PAYMENT_DUPLICATE_REQUEST = "PAYMENT_DUPLICATE_REQUEST"
    PAYMENT_STATE_CONFLICT = "PAYMENT_STATE_CONFLICT"

    # Webhook
    WEBHOOK_RECEIVED = "WEBHOOK_RECEIVED"
    WEBHOOK_SIGNATURE_INVALID = "WEBHOOK_SIGNATURE_INVALID"
    WEBHOOK_PROCESSED = "WEBHOOK_PROCESSED"
    WEBHOOK_DUPLICATE = "WEBHOOK_DUPLICATE"
    WEBHOOK_IGNORED = "WEBHOOK_IGNORED"
    WEBHOOK_PROCESSING_FAILED = "WEBHOOK_PROCESSING_FAILED"

    # Inventory
    INVENTORY_RESERVED = "INVENTORY_RESERVED"
    INVENTORY_RESERVATION_RELEASED = "INVENTORY_RESERVATION_RELEASED"
    INVENTORY_FINALIZATION_STARTED = "INVENTORY_FINALIZATION_STARTED"
    INVENTORY_FINALIZED = "INVENTORY_FINALIZED"
    INVENTORY_FINALIZATION_SKIPPED = "INVENTORY_FINALIZATION_SKIPPED"
    INVENTORY_FINALIZATION_FAILED = "INVENTORY_FINALIZATION_FAILED"

    # System & Security
    SESSION_ACCESS_REJECTED = "SESSION_ACCESS_REJECTED"
    RATE_LIMIT_REJECTED = "RATE_LIMIT_REJECTED"
    VALIDATION_FAILED = "VALIDATION_FAILED"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    RECOVERY_STARTED = "RECOVERY_STARTED"
    RECOVERY_COMPLETED = "RECOVERY_COMPLETED"
    RECOVERY_FAILED = "RECOVERY_FAILED"


class AuditEventResponse(BaseModel):
    """Sanitized Merchant Audit Event Model."""
    id: str
    event_type: str
    event_status: str
    actor_type: str
    session_id: str
    checkout_id: Optional[str] = None
    order_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    payment_attempt_id: Optional[str] = None
    product_id: Optional[str] = None
    correlation_id: Optional[str] = None
    parent_event_id: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    request_id: Optional[str] = None
    reason_code: Optional[str] = None
    failure_code: Optional[str] = None
    recovery_action: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditTrailListResponse(BaseModel):
    """Paginated Audit Trail Response for Merchant Timeline."""
    total_events: int
    limit: int
    offset: int
    events: List[AuditEventResponse]
