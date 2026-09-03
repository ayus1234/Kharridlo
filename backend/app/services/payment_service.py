import uuid
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.payment import PaymentOrder, PaymentAttempt, CheckoutSession
from app.services.checkout_service import CheckoutService
from app.services.razorpay_client import razorpay_client
from app.services.audit_service import AuditService


class PaymentService:
    """
    Server-side Razorpay Order Orchestrator.
    Guarantees deterministic creation, idempotency, and audit trail recording.
    """

    @classmethod
    def create_payment_order(cls, db: Session, checkout_id: str, session_id: str) -> PaymentOrder:
        """
        Create a server-side Razorpay order after strictly revalidating policy and stock.
        Guarantees idempotency: returns existing active order if already created for this checkout.
        """
        # Strict pre-order gate: re-validates cart, prices, stock, policy limits, and buyer confirmation
        checkout = CheckoutService.validate_checkout_for_order(db, checkout_id, session_id)

        # Idempotency check: if an active order already exists for this checkout, return it
        existing_order = (
            db.query(PaymentOrder)
            .filter(
                PaymentOrder.checkout_id == checkout.id,
                PaymentOrder.status.in_(["created", "attempted"])
            )
            .first()
        )
        if existing_order:
            return existing_order

        # Generate unique receipt string
        receipt = f"rcpt_{uuid.uuid4().hex[:16]}"

        # Server-side Razorpay order creation
        rzp_order = razorpay_client.create_order(
            amount_paise=checkout.total_paise,
            currency=checkout.currency,
            receipt=receipt,
            notes={
                "checkout_id": checkout.id,
                "session_id": session_id,
            },
        )

        razorpay_order_id = rzp_order["id"]

        order = PaymentOrder(
            checkout_id=checkout.id,
            session_id=session_id,
            razorpay_order_id=razorpay_order_id,
            amount_paise=checkout.total_paise,
            currency=checkout.currency,
            receipt=receipt,
            status="created",
        )
        db.add(order)

        checkout.status = "ORDER_CREATED"
        checkout.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(order)

        AuditService.log_event(
            db=db,
            actor_type="SYSTEM",
            session_id=session_id,
            event_type="ORDER_CREATED",
            checkout_id=checkout.id,
            order_id=order.id,
            razorpay_order_id=razorpay_order_id,
            metadata={
                "amount_paise": order.amount_paise,
                "currency": order.currency,
                "receipt": receipt,
            },
        )

        return order

    @classmethod
    def get_payment_order(cls, db: Session, order_id: str, session_id: Optional[str] = None) -> PaymentOrder:
        """Lookup order by internal order ID."""
        query = db.query(PaymentOrder).filter(PaymentOrder.id == order_id)
        if session_id:
            query = query.filter(PaymentOrder.session_id == session_id)
        order = query.first()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "ORDER_NOT_FOUND", "message": f"Order '{order_id}' not found."}
            )
        return order

    @classmethod
    def cancel_payment_order(
        cls,
        db: Session,
        order_id: str,
        session_id: str,
        reason: Optional[str] = "buyer_dismissed_checkout",
        razorpay_payment_id: Optional[str] = None,
        failure_code: Optional[str] = None,
        failure_description: Optional[str] = None,
    ) -> PaymentOrder:
        """
        Record buyer cancellation or checkout modal dismissal.
        Prevents payment retry on already paid orders.
        """
        order = cls.get_payment_order(db, order_id, session_id)
        if order.status == "paid":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "ORDER_ALREADY_PAID", "message": "Cannot cancel an already completed payment order."}
            )

        checkout = db.query(CheckoutSession).filter(CheckoutSession.id == order.checkout_id).first()
        is_failure = bool(failure_code or (reason and "fail" in reason.lower()))

        order.status = "failed" if is_failure else "cancelled"
        order.updated_at = datetime.now(timezone.utc)

        if checkout:
            checkout.status = "PAYMENT_FAILED" if is_failure else "PAYMENT_CANCELLED"
            checkout.updated_at = datetime.now(timezone.utc)

        if razorpay_payment_id:
            attempt = PaymentAttempt(
                order_id=order.id,
                razorpay_order_id=order.razorpay_order_id,
                razorpay_payment_id=razorpay_payment_id,
                amount_paise=order.amount_paise,
                currency=order.currency,
                status="FAILED" if is_failure else "CANCELLED",
                failure_code=failure_code or reason,
                failure_description=failure_description,
                signature_verified=False,
            )
            db.add(attempt)

        db.commit()
        db.refresh(order)

        AuditService.log_event(
            db=db,
            actor_type="BUYER",
            session_id=session_id,
            event_type="PAYMENT_FAILED" if is_failure else "PAYMENT_CANCELLED",
            checkout_id=order.checkout_id,
            order_id=order.id,
            razorpay_order_id=order.razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id,
            metadata={
                "reason": reason,
                "failure_code": failure_code,
                "failure_description": failure_description,
            },
        )

        return order
