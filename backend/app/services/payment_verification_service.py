from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.payment import PaymentOrder, PaymentAttempt, CheckoutSession
from app.services.cart_service import CartService
from app.services.razorpay_client import razorpay_client
from app.services.audit_service import AuditService
from app.schemas.audit import AuditEventType


class PaymentVerificationService:
    """
    Authoritative Payment Verification Service.
    Enforces HMAC-SHA256 signature verification, idempotent capture transitions,
    and finalized inventory consumption.
    """

    @classmethod
    def verify_payment(
        cls,
        db: Session,
        internal_order_id: str,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
    ) -> PaymentAttempt:
        """
        Verify payment signature and execute state transitions transactionally.
        Idempotent: repeating with the same valid payment returns the existing captured record.
        """
        # 1. Load internal order
        order = db.query(PaymentOrder).filter(PaymentOrder.id == internal_order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "ORDER_NOT_FOUND", "message": f"Order '{internal_order_id}' not found."}
            )

        # Log verification attempt
        AuditService.log_event(
            db=db,
            actor_type="BUYER",
            session_id=order.session_id,
            event_type=AuditEventType.PAYMENT_VERIFICATION_STARTED.value,
            event_status="attempted",
            order_id=order.id,
            checkout_id=order.checkout_id,
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id,
            metadata={"amount_paise": order.amount_paise},
        )

        # 2. Verify Razorpay Order ID matches internal mapping
        if order.razorpay_order_id != razorpay_order_id:
            AuditService.log_event(
                db=db,
                actor_type="SYSTEM",
                session_id=order.session_id,
                event_type="PAYMENT_MISMATCH",
                event_status="rejected",
                failure_code="ORDER_MISMATCH",
                recovery_action="VERIFY_ORDER_MAPPING",
                order_id=order.id,
                razorpay_order_id=razorpay_order_id,
                razorpay_payment_id=razorpay_payment_id,
                metadata={"reason": "Mismatched Razorpay order ID in verification payload."},
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "ORDER_MISMATCH", "message": "Provided Razorpay order ID does not match internal order."}
            )

        # 3. Idempotency check: if already captured, return existing attempt without duplicating effects
        existing_attempt = (
            db.query(PaymentAttempt)
            .filter(PaymentAttempt.razorpay_payment_id == razorpay_payment_id)
            .first()
        )
        if existing_attempt and existing_attempt.status == "CAPTURED":
            AuditService.log_event(
                db=db,
                actor_type="BUYER",
                session_id=order.session_id,
                event_type=AuditEventType.PAYMENT_DUPLICATE_REQUEST.value,
                event_status="succeeded",
                reason_code="ALREADY_CAPTURED",
                order_id=order.id,
                checkout_id=order.checkout_id,
                razorpay_order_id=razorpay_order_id,
                razorpay_payment_id=razorpay_payment_id,
                payment_attempt_id=existing_attempt.id,
                idempotency_key=f"verify_dup_{razorpay_payment_id}",
                metadata={"message": "Duplicate verification request received for already-captured payment."},
            )
            return existing_attempt

        # 4. Verify cryptographic HMAC signature
        is_valid_signature = razorpay_client.verify_payment_signature(
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id,
            razorpay_signature=razorpay_signature,
        )

        if not is_valid_signature:
            # Record failed attempt
            failed_attempt = PaymentAttempt(
                order_id=order.id,
                razorpay_order_id=razorpay_order_id,
                razorpay_payment_id=razorpay_payment_id,
                amount_paise=order.amount_paise,
                currency=order.currency,
                status="FAILED",
                failure_code="BAD_SIGNATURE",
                failure_description="Cryptographic HMAC-SHA256 signature verification failed.",
                signature_verified=False,
            )
            db.add(failed_attempt)
            db.commit()

            AuditService.log_event(
                db=db,
                actor_type="PAYMENT_PROVIDER",
                session_id=order.session_id,
                event_type=AuditEventType.PAYMENT_FAILED.value,
                event_status="failed",
                failure_code="INVALID_SIGNATURE",
                recovery_action="RETRY_PAYMENT",
                order_id=order.id,
                checkout_id=order.checkout_id,
                razorpay_order_id=razorpay_order_id,
                razorpay_payment_id=razorpay_payment_id,
                payment_attempt_id=failed_attempt.id,
                metadata={"reason": "Invalid payment signature."},
            )

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_SIGNATURE", "message": "Payment signature verification failed."}
            )

        # 5. On verified signature, apply transitions transactionally
        now = datetime.now(timezone.utc)
        if existing_attempt:
            existing_attempt.status = "CAPTURED"
            existing_attempt.signature_verified = True
            existing_attempt.captured_at = now
            attempt = existing_attempt
        else:
            attempt = PaymentAttempt(
                order_id=order.id,
                razorpay_order_id=razorpay_order_id,
                razorpay_payment_id=razorpay_payment_id,
                amount_paise=order.amount_paise,
                currency=order.currency,
                status="CAPTURED",
                signature_verified=True,
                captured_at=now,
            )
            db.add(attempt)

        # Update order and checkout statuses
        order.status = "paid"
        order.updated_at = now

        checkout = db.query(CheckoutSession).filter(CheckoutSession.id == order.checkout_id).first()
        if checkout:
            checkout.status = "PAYMENT_SUCCESS"
            checkout.updated_at = now

            # Finalize cart inventory consumption (permanently deducts from reserved stock)
            if checkout.cart:
                CartService.finalize_cart_checkout(db, checkout.cart)

        db.commit()
        db.refresh(attempt)

        AuditService.log_event(
            db=db,
            actor_type="SYSTEM",
            session_id=order.session_id,
            event_type=AuditEventType.PAYMENT_VERIFIED.value,
            event_status="succeeded",
            checkout_id=order.checkout_id,
            order_id=order.id,
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id,
            payment_attempt_id=attempt.id,
            metadata={"signature_verified": True},
        )

        AuditService.log_event(
            db=db,
            actor_type="SYSTEM",
            session_id=order.session_id,
            event_type=AuditEventType.PAYMENT_CAPTURED.value,
            event_status="succeeded",
            checkout_id=order.checkout_id,
            order_id=order.id,
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id,
            payment_attempt_id=attempt.id,
            metadata={
                "amount_paise": order.amount_paise,
                "currency": order.currency,
                "signature_verified": True,
            },
        )

        return attempt
