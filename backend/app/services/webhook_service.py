import json
import hashlib
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.payment import WebhookEvent, PaymentOrder, PaymentAttempt, CheckoutSession
from app.services.cart_service import CartService
from app.services.razorpay_client import razorpay_client
from app.services.audit_service import AuditService


class WebhookService:
    """
    Secure Razorpay Webhook Ingestion Service.
    Enforces raw-body signature validation, deduplication, and transactional state mutations.
    """

    @classmethod
    def process_webhook(cls, db: Session, raw_body: bytes, signature_header: Optional[str]) -> Dict[str, Any]:
        """
        Verify incoming webhook signature and process events idempotently.
        """
        if not signature_header:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "MISSING_SIGNATURE", "message": "X-Razorpay-Signature header is missing."}
            )

        # 1. Verify cryptographic HMAC signature against raw body bytes
        if not razorpay_client.verify_webhook_signature(raw_body, signature_header):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_WEBHOOK_SIGNATURE", "message": "Webhook signature verification failed."}
            )

        # 2. Compute SHA-256 payload hash for deduplication
        payload_hash = hashlib.sha256(raw_body).hexdigest()

        # Parse JSON
        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_JSON", "message": "Invalid JSON payload."}
            )

        event_type = payload.get("event", "unknown")
        razorpay_event_id = payload.get("event_id") or payload.get("id")

        # 3. Idempotency Check: check if event was already received
        existing_event = (
            db.query(WebhookEvent)
            .filter(
                (WebhookEvent.payload_hash == payload_hash) |
                (WebhookEvent.razorpay_event_id == razorpay_event_id if razorpay_event_id else False)
            )
            .first()
        )

        if existing_event and existing_event.processing_status in ("PROCESSED", "DUPLICATE"):
            AuditService.log_event(
                db=db,
                actor_type="WEBHOOK",
                session_id="system_webhook",
                event_type="WEBHOOK_DUPLICATE_IGNORED",
                metadata={"event_type": event_type, "event_id": razorpay_event_id},
            )
            return {
                "status": "duplicate",
                "event_type": event_type,
                "message": "Webhook event was already processed previously.",
            }

        # 4. Log WebhookEvent as PENDING
        webhook_record = WebhookEvent(
            razorpay_event_id=razorpay_event_id,
            payload_hash=payload_hash,
            event_type=event_type,
            processing_status="PENDING",
        )
        db.add(webhook_record)
        db.commit()

        # 5. Route by Event Type
        now = datetime.now(timezone.utc)
        order_entity = payload.get("payload", {}).get("order", {}).get("entity", {})
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})

        rzp_order_id = payment_entity.get("order_id") or order_entity.get("id")
        rzp_payment_id = payment_entity.get("id")

        order = None
        if rzp_order_id:
            order = db.query(PaymentOrder).filter(PaymentOrder.razorpay_order_id == rzp_order_id).first()

        if event_type == "payment.captured":
            if order:
                # Update or create payment attempt
                attempt = (
                    db.query(PaymentAttempt)
                    .filter(PaymentAttempt.razorpay_payment_id == rzp_payment_id)
                    .first()
                ) if rzp_payment_id else None

                if not attempt and rzp_payment_id:
                    attempt = PaymentAttempt(
                        order_id=order.id,
                        razorpay_order_id=order.razorpay_order_id,
                        razorpay_payment_id=rzp_payment_id,
                        amount_paise=payment_entity.get("amount", order.amount_paise),
                        currency=payment_entity.get("currency", order.currency),
                        method=payment_entity.get("method"),
                        status="CAPTURED",
                        signature_verified=True,
                        captured_at=now,
                    )
                    db.add(attempt)
                elif attempt:
                    attempt.status = "CAPTURED"
                    attempt.captured_at = now

                order.status = "paid"
                order.updated_at = now

                checkout = db.query(CheckoutSession).filter(CheckoutSession.id == order.checkout_id).first()
                if checkout:
                    checkout.status = "PAYMENT_SUCCESS"
                    checkout.updated_at = now
                    if checkout.cart:
                        CartService.finalize_cart_checkout(db, checkout.cart)

                AuditService.log_event(
                    db=db,
                    actor_type="WEBHOOK",
                    session_id=order.session_id,
                    event_type="PAYMENT_CAPTURED",
                    checkout_id=order.checkout_id,
                    order_id=order.id,
                    razorpay_order_id=rzp_order_id,
                    razorpay_payment_id=rzp_payment_id,
                    metadata={"source": "razorpay_webhook", "event_type": event_type},
                )

        elif event_type == "payment.failed":
            if order:
                attempt = (
                    db.query(PaymentAttempt)
                    .filter(PaymentAttempt.razorpay_payment_id == rzp_payment_id)
                    .first()
                ) if rzp_payment_id else None

                error_code = payment_entity.get("error_code")
                error_desc = payment_entity.get("error_description")

                if not attempt and rzp_payment_id:
                    attempt = PaymentAttempt(
                        order_id=order.id,
                        razorpay_order_id=order.razorpay_order_id,
                        razorpay_payment_id=rzp_payment_id,
                        amount_paise=payment_entity.get("amount", order.amount_paise),
                        currency=payment_entity.get("currency", order.currency),
                        status="FAILED",
                        failure_code=error_code,
                        failure_description=error_desc,
                        signature_verified=False,
                    )
                    db.add(attempt)
                elif attempt:
                    attempt.status = "FAILED"
                    attempt.failure_code = error_code
                    attempt.failure_description = error_desc

                order.status = "failed"
                order.updated_at = now

                checkout = db.query(CheckoutSession).filter(CheckoutSession.id == order.checkout_id).first()
                if checkout:
                    checkout.status = "PAYMENT_FAILED"
                    checkout.updated_at = now

                AuditService.log_event(
                    db=db,
                    actor_type="WEBHOOK",
                    session_id=order.session_id,
                    event_type="PAYMENT_FAILED",
                    checkout_id=order.checkout_id,
                    order_id=order.id,
                    razorpay_order_id=rzp_order_id,
                    razorpay_payment_id=rzp_payment_id,
                    metadata={"error_code": error_code, "error_desc": error_desc},
                )

        elif event_type == "order.paid":
            if order:
                order.status = "paid"
                order.updated_at = now
                checkout = db.query(CheckoutSession).filter(CheckoutSession.id == order.checkout_id).first()
                if checkout:
                    checkout.status = "PAYMENT_SUCCESS"
                    checkout.updated_at = now

        else:
            # Unsupported or info event: do not mutate core checkout state
            webhook_record.processing_status = "IGNORED"
            db.commit()
            return {
                "status": "ignored",
                "event_type": event_type,
                "message": f"Webhook event '{event_type}' acknowledged and ignored.",
            }

        webhook_record.processing_status = "PROCESSED"
        webhook_record.processed_at = now
        db.commit()

        AuditService.log_event(
            db=db,
            actor_type="WEBHOOK",
            session_id=order.session_id if order else "system_webhook",
            event_type="WEBHOOK_PROCESSED",
            order_id=order.id if order else None,
            razorpay_order_id=rzp_order_id,
            metadata={"event_type": event_type, "event_id": razorpay_event_id},
        )

        return {
            "status": "processed",
            "event_type": event_type,
            "message": "Webhook event processed successfully.",
        }
