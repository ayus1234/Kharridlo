from typing import Optional
from fastapi import APIRouter, Depends, Header, Query, Request, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.payment import PaymentOrder, PaymentAttempt, AuditEvent
from app.schemas.payment import (
    CreateOrderRequest,
    CreateOrderResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
    PaymentCancelRequest,
    PaymentCancelResponse,
    AuditEventResponse,
    AuditListResponse,
)
from app.services.payment_service import PaymentService
from app.services.payment_verification_service import PaymentVerificationService
from app.services.webhook_service import WebhookService
from app.services.audit_service import AuditService
from app.services.razorpay_client import razorpay_client

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/orders", response_model=CreateOrderResponse, summary="Create server-side Razorpay order")
def create_payment_order(
    payload: CreateOrderRequest,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> CreateOrderResponse:
    """
    Create a server-side Razorpay order.
    Amount is strictly calculated from authoritative database cart snapshot.
    Immediately revalidates policy limits, stock availability, and buyer confirmation.
    """
    effective_session_id = x_session_id or session_id
    if not effective_session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "MISSING_SESSION_ID", "message": "X-Session-ID header or session_id query param is required."}
        )

    order = PaymentService.create_payment_order(
        db=db,
        checkout_id=payload.checkout_id,
        session_id=effective_session_id,
    )

    return CreateOrderResponse(
        internal_order_id=order.id,
        razorpay_order_id=order.razorpay_order_id,
        amount_paise=order.amount_paise,
        amount_inr=round(order.amount_paise / 100.0, 2),
        currency=order.currency,
        receipt=order.receipt,
        status=order.status,
        key_id=razorpay_client.key_id,
        created_at=order.created_at,
    )


@router.get("/orders/{order_id}", summary="Get payment order status")
def get_payment_order(
    order_id: str,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    db: Session = Depends(get_db),
):
    """Retrieve public order status safely."""
    order = PaymentService.get_payment_order(db, order_id=order_id, session_id=x_session_id)
    return {
        "internal_order_id": order.id,
        "razorpay_order_id": order.razorpay_order_id,
        "amount_paise": order.amount_paise,
        "amount_inr": round(order.amount_paise / 100.0, 2),
        "currency": order.currency,
        "status": order.status,
        "receipt": order.receipt,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
    }


@router.post("/verify", response_model=PaymentVerifyResponse, summary="Verify payment signature")
def verify_payment(
    payload: PaymentVerifyRequest,
    db: Session = Depends(get_db),
) -> PaymentVerifyResponse:
    """
    Authoritative payment signature verification endpoint.
    Verifies cryptographic HMAC-SHA256 signature, transitions order state,
    and finalizes cart stock consumption idempotently.
    """
    attempt = PaymentVerificationService.verify_payment(
        db=db,
        internal_order_id=payload.internal_order_id,
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_payment_id=payload.razorpay_payment_id,
        razorpay_signature=payload.razorpay_signature,
    )

    return PaymentVerifyResponse(
        verified=True,
        status=attempt.status,
        internal_order_id=payload.internal_order_id,
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_payment_id=payload.razorpay_payment_id,
        amount_paise=attempt.amount_paise,
        amount_inr=round(attempt.amount_paise / 100.0, 2),
        currency=attempt.currency,
        captured_at=attempt.captured_at,
        message="Payment verified and captured successfully.",
    )


@router.post("/cancel", response_model=PaymentCancelResponse, summary="Handle checkout cancellation or failure")
def cancel_payment(
    payload: PaymentCancelRequest,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> PaymentCancelResponse:
    """Record checkout modal dismissal or client payment failure safely."""
    effective_session_id = x_session_id or session_id
    if not effective_session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "MISSING_SESSION_ID", "message": "X-Session-ID header or session_id query param is required."}
        )

    order = PaymentService.cancel_payment_order(
        db=db,
        order_id=payload.internal_order_id,
        session_id=effective_session_id,
        reason=payload.reason,
        razorpay_payment_id=payload.razorpay_payment_id,
        failure_code=payload.failure_code,
        failure_description=payload.failure_description,
    )

    return PaymentCancelResponse(
        status=order.status,
        internal_order_id=order.id,
        message="Payment order cancellation recorded successfully.",
    )


@router.post("/webhook", summary="Receive Razorpay webhook events")
async def receive_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
    db: Session = Depends(get_db),
):
    """
    Ingest Razorpay webhooks securely.
    Verifies HMAC-SHA256 signature against raw request body and deduplicates idempotently.
    """
    raw_body = await request.body()
    result = WebhookService.process_webhook(
        db=db,
        raw_body=raw_body,
        signature_header=x_razorpay_signature,
    )
    return result


@router.get("/audit", response_model=AuditListResponse, summary="Merchant audit trail visibility")
def get_merchant_audit_trail(
    session_id: Optional[str] = Query(None),
    order_id: Optional[str] = Query(None),
    razorpay_order_id: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> AuditListResponse:
    """
    Merchant-side visibility endpoint into the immutable audit trail.
    Guaranteed to return safe operational data without API keys or secret tokens.
    """
    events = AuditService.get_audit_trail(
        db=db,
        session_id=session_id,
        order_id=order_id,
        razorpay_order_id=razorpay_order_id,
        event_type=event_type,
        limit=limit,
        offset=offset,
    )
    total_count = AuditService.count_audit_events(
        db=db,
        session_id=session_id,
        order_id=order_id,
        razorpay_order_id=razorpay_order_id,
        event_type=event_type,
    )

    event_responses = [
        AuditEventResponse(
            id=e.id,
            actor_type=e.actor_type,
            session_id=e.session_id,
            event_type=e.event_type,
            checkout_id=e.checkout_id,
            order_id=e.order_id,
            razorpay_order_id=e.razorpay_order_id,
            razorpay_payment_id=e.razorpay_payment_id,
            metadata_json=e.metadata_json,
            created_at=e.created_at,
        )
        for e in events
    ]

    return AuditListResponse(
        total_events=total_count,
        events=event_responses,
    )
