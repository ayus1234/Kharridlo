from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict


class CheckoutStatus(str, Enum):
    CART_REVIEW = "CART_REVIEW"
    AUTHORIZATION_REQUIRED = "AUTHORIZATION_REQUIRED"
    BUYER_CONFIRMED = "BUYER_CONFIRMED"
    ORDER_CREATED = "ORDER_CREATED"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    PAYMENT_SUCCESS = "PAYMENT_SUCCESS"
    PAYMENT_FAILED = "PAYMENT_FAILED"
    PAYMENT_CANCELLED = "PAYMENT_CANCELLED"
    EXPIRED = "EXPIRED"
    BLOCKED = "BLOCKED"


class PaymentAttemptStatus(str, Enum):
    CREATED = "CREATED"
    AUTHORIZED = "AUTHORIZED"
    CAPTURED = "CAPTURED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"
    UNKNOWN = "UNKNOWN"


class CheckoutConfirmRequest(BaseModel):
    buyer_confirmed: bool = Field(True, description="Explicit buyer confirmation after reviewing cart and policy gate.")


class CheckoutSessionResponse(BaseModel):
    id: str
    session_id: str
    cart_id: str
    subtotal_paise: int
    subtotal_inr: float
    total_paise: int
    total_inr: float
    currency: str = "INR"
    policy_tier: str
    policy_decision: str
    buyer_confirmed: bool
    buyer_confirmed_at: Optional[datetime] = None
    status: str
    cart_snapshot: Optional[List[Dict[str, Any]]] = None
    expires_at: datetime
    is_expired: bool
    created_at: datetime
    updated_at: datetime


class CreateOrderRequest(BaseModel):
    checkout_id: str = Field(..., description="ID of the confirmed checkout session.")


class CreateOrderResponse(BaseModel):
    internal_order_id: str
    razorpay_order_id: str
    amount_paise: int
    amount_inr: float
    currency: str = "INR"
    receipt: str
    status: str
    key_id: str  # Safe public key ID for frontend Razorpay Checkout
    created_at: datetime


class PaymentVerifyRequest(BaseModel):
    internal_order_id: str = Field(..., description="Internal Kharridlo order ID")
    razorpay_order_id: str = Field(..., description="Razorpay order ID")
    razorpay_payment_id: str = Field(..., description="Razorpay payment ID")
    razorpay_signature: str = Field(..., description="HMAC-SHA256 signature from Razorpay Checkout")


class PaymentVerifyResponse(BaseModel):
    verified: bool
    status: str
    internal_order_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    amount_paise: int
    amount_inr: float
    currency: str = "INR"
    captured_at: Optional[datetime] = None
    message: str


class PaymentCancelRequest(BaseModel):
    internal_order_id: str = Field(..., description="Internal Kharridlo order ID")
    reason: Optional[str] = Field("buyer_dismissed_checkout", description="Reason for cancellation")
    razorpay_payment_id: Optional[str] = Field(None, description="Optional payment ID if failure occurred")
    failure_code: Optional[str] = None
    failure_description: Optional[str] = None


class PaymentCancelResponse(BaseModel):
    status: str
    internal_order_id: str
    message: str


class AuditEventResponse(BaseModel):
    id: str
    actor_type: str
    session_id: str
    event_type: str
    event_status: str = "succeeded"
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


class AuditListResponse(BaseModel):
    total_events: int
    limit: Optional[int] = 50
    offset: Optional[int] = 0
    events: List[AuditEventResponse]
