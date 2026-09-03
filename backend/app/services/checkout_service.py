from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.payment import CheckoutSession, get_default_checkout_expiry
from app.models.cart import Cart
from app.services.cart_service import CartService, CartException
from app.services.policy_service import PolicyService
from app.services.audit_service import AuditService


class CheckoutService:
    """
    Deterministic Checkout Service.
    Enforces cart snapshotting, policy evaluation, buyer authorization, and immediate pre-order revalidation.
    """

    @classmethod
    def create_or_get_checkout(cls, db: Session, session_id: str) -> CheckoutSession:
        """
        Initiate or refresh a checkout session for a buyer session.
        Snapshots cart items, validates stock, and runs authoritative policy check.
        """
        cart = CartService.get_cart(db, session_id)
        if not cart or not cart.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "CART_EMPTY", "message": "Cannot initiate checkout with an empty cart."}
            )

        if cart.is_expired or cart.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "CART_EXPIRED", "message": "Cart session has expired. Please refresh your cart."}
            )

        # Validate cart fulfillability
        is_valid, issues, _ = CartService.validate_cart(db, session_id)
        if not is_valid:
            issue_msgs = "; ".join(i.get("message", "") for i in issues)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "CART_INVALID", "message": f"Cart cannot be checked out: {issue_msgs}"}
            )

        # Authoritative Policy Evaluation
        policy_eval = PolicyService.evaluate_cart(db, session_id)

        # Build Immutable Item Snapshot
        cart_snapshot: List[Dict[str, Any]] = []
        for item in cart.items:
            product = item.product
            cart_snapshot.append({
                "product_id": item.product_id,
                "sku": product.sku if product else "UNKNOWN",
                "name": product.name if product else "Unknown Product",
                "unit_price_paise": item.unit_price_paise,
                "quantity": item.quantity,
                "line_total_paise": item.line_total_paise,
            })

        # Determine Initial Status
        if policy_eval.decision == "BLOCK":
            init_status = "BLOCKED"
        elif policy_eval.decision == "AUTHORIZATION_REQUIRED":
            init_status = "AUTHORIZATION_REQUIRED"
        else:
            init_status = "CART_REVIEW"

        # Check for existing uncompleted checkout session
        checkout = (
            db.query(CheckoutSession)
            .filter(
                CheckoutSession.session_id == session_id,
                CheckoutSession.status.in_(["CART_REVIEW", "AUTHORIZATION_REQUIRED", "BUYER_CONFIRMED", "BLOCKED"])
            )
            .first()
        )

        if checkout:
            # Update existing session with fresh snapshot & policy
            checkout.cart_id = cart.id
            checkout.subtotal_paise = cart.subtotal_paise
            checkout.total_paise = cart.total_paise
            checkout.policy_tier = policy_eval.policy_tier
            checkout.policy_decision = policy_eval.decision
            checkout.cart_snapshot = cart_snapshot
            checkout.status = init_status
            checkout.buyer_confirmed = False  # Invalidate prior confirmation on fresh checkout
            checkout.buyer_confirmed_at = None
            checkout.expires_at = get_default_checkout_expiry()
        else:
            checkout = CheckoutSession(
                session_id=session_id,
                cart_id=cart.id,
                subtotal_paise=cart.subtotal_paise,
                total_paise=cart.total_paise,
                currency="INR",
                policy_tier=policy_eval.policy_tier,
                policy_decision=policy_eval.decision,
                buyer_confirmed=False,
                status=init_status,
                cart_snapshot=cart_snapshot,
                expires_at=get_default_checkout_expiry(),
            )
            db.add(checkout)

        db.commit()
        db.refresh(checkout)

        AuditService.log_event(
            db=db,
            actor_type="BUYER",
            session_id=session_id,
            event_type="CHECKOUT_INITIATED",
            checkout_id=checkout.id,
            metadata={
                "total_paise": checkout.total_paise,
                "policy_decision": checkout.policy_decision,
                "policy_tier": checkout.policy_tier,
                "item_count": len(cart_snapshot),
            },
        )

        return checkout

    @classmethod
    def confirm_buyer_authorization(cls, db: Session, checkout_id: str, session_id: str, buyer_confirmed: bool = True) -> CheckoutSession:
        """
        Record explicit buyer confirmation.
        Enforces policy compliance and rejects unconfirmed requests.
        """
        checkout = db.query(CheckoutSession).filter(CheckoutSession.id == checkout_id, CheckoutSession.session_id == session_id).first()
        if not checkout:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "CHECKOUT_NOT_FOUND", "message": "Checkout session not found."}
            )

        if checkout.is_expired:
            checkout.status = "EXPIRED"
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "CHECKOUT_EXPIRED", "message": "Checkout session has expired. Please restart checkout."}
            )

        if checkout.status == "BLOCKED" or checkout.policy_decision == "BLOCK":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "POLICY_BLOCKED", "message": "Checkout is blocked by commerce policy spending limits."}
            )

        if not buyer_confirmed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "CONFIRMATION_REQUIRED", "message": "Explicit buyer confirmation is required to proceed."}
            )

        checkout.buyer_confirmed = True
        checkout.buyer_confirmed_at = datetime.now(timezone.utc)
        checkout.status = "BUYER_CONFIRMED"
        checkout.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(checkout)

        AuditService.log_event(
            db=db,
            actor_type="BUYER",
            session_id=session_id,
            event_type="BUYER_CONFIRMED",
            checkout_id=checkout.id,
            metadata={
                "total_paise": checkout.total_paise,
                "policy_decision": checkout.policy_decision,
            },
        )

        return checkout

    @classmethod
    def validate_checkout_for_order(cls, db: Session, checkout_id: str, session_id: str) -> CheckoutSession:
        """
        Immediate Pre-Order Validation Gate:
        1. Verifies checkout existence and validity.
        2. Verifies checkout has not expired.
        3. Enforces buyer confirmation.
        4. Reloads cart and live product prices from database.
        5. Verifies stock availability.
        6. Reevaluates policy (strictly rejects if BLOCK).
        """
        checkout = db.query(CheckoutSession).filter(CheckoutSession.id == checkout_id, CheckoutSession.session_id == session_id).first()
        if not checkout:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "CHECKOUT_NOT_FOUND", "message": "Checkout session not found."}
            )

        if checkout.is_expired:
            checkout.status = "EXPIRED"
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "CHECKOUT_EXPIRED", "message": "Checkout session has expired. Please restart checkout."}
            )

        if not checkout.buyer_confirmed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "CONFIRMATION_REQUIRED", "message": "Buyer has not confirmed checkout authorization."}
            )

        # Reload authoritative cart
        cart = CartService.get_cart(db, session_id)
        if not cart or not cart.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "CART_EMPTY", "message": "Cart is empty."}
            )

        # Re-check cart price tampering / divergence from snapshot
        if cart.total_paise != checkout.total_paise:
            checkout.buyer_confirmed = False
            checkout.status = "CART_REVIEW"
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "CART_MODIFIED", "message": "Cart total changed after confirmation. Please review and re-confirm."}
            )

        # Re-validate stock and items
        is_valid, issues, _ = CartService.validate_cart(db, session_id)
        if not is_valid:
            issue_msgs = "; ".join(i.get("message", "") for i in issues)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INSUFFICIENT_STOCK", "message": f"Inventory check failed: {issue_msgs}"}
            )

        # Reevaluate Policy Authoritatively
        policy_eval = PolicyService.evaluate_cart(db, session_id)
        if policy_eval.decision == "BLOCK":
            checkout.status = "BLOCKED"
            checkout.policy_decision = "BLOCK"
            db.commit()
            AuditService.log_event(
                db=db,
                actor_type="SYSTEM",
                session_id=session_id,
                event_type="POLICY_BLOCKED",
                checkout_id=checkout.id,
                metadata={"reason": "Policy revalidation blocked order creation."},
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "POLICY_BLOCKED", "message": "Transaction blocked by commerce policy limit."}
            )

        AuditService.log_event(
            db=db,
            actor_type="SYSTEM",
            session_id=session_id,
            event_type="POLICY_REVALIDATED",
            checkout_id=checkout.id,
            metadata={
                "policy_decision": policy_eval.decision,
                "remaining_buffer_paise": policy_eval.remaining_buffer_paise,
            },
        )

        return checkout
