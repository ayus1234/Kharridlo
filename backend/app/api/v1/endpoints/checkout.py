from typing import Optional
from fastapi import APIRouter, Depends, Header, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.payment import CheckoutSession
from app.schemas.payment import (
    CheckoutConfirmRequest,
    CheckoutSessionResponse,
)
from app.services.checkout_service import CheckoutService

router = APIRouter(prefix="/checkout", tags=["Checkout"])


def _to_checkout_response(checkout: CheckoutSession) -> CheckoutSessionResponse:
    """Format CheckoutSession SQLAlchemy model into CheckoutSessionResponse schema."""
    return CheckoutSessionResponse(
        id=checkout.id,
        session_id=checkout.session_id,
        cart_id=checkout.cart_id,
        subtotal_paise=checkout.subtotal_paise,
        subtotal_inr=round(checkout.subtotal_paise / 100.0, 2),
        total_paise=checkout.total_paise,
        total_inr=round(checkout.total_paise / 100.0, 2),
        currency=checkout.currency,
        policy_tier=checkout.policy_tier,
        policy_decision=checkout.policy_decision,
        buyer_confirmed=checkout.buyer_confirmed,
        buyer_confirmed_at=checkout.buyer_confirmed_at,
        status=checkout.status,
        cart_snapshot=checkout.cart_snapshot,
        expires_at=checkout.expires_at,
        is_expired=checkout.is_expired,
        created_at=checkout.created_at,
        updated_at=checkout.updated_at,
    )


@router.post("/confirm", response_model=CheckoutSessionResponse, summary="Initiate and authorize checkout")
def confirm_checkout(
    payload: CheckoutConfirmRequest,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> CheckoutSessionResponse:
    """
    Authoritative checkout initiation and confirmation gate.
    Validates cart, snapshots items, evaluates policy limits, and records buyer authorization.
    """
    effective_session_id = x_session_id or session_id
    if not effective_session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "MISSING_SESSION_ID", "message": "X-Session-ID header or session_id query param is required."}
        )

    # 1. Create or refresh checkout session with current cart & policy
    checkout = CheckoutService.create_or_get_checkout(db, effective_session_id)

    # 2. If buyer explicitly confirmed, transition to BUYER_CONFIRMED
    if payload.buyer_confirmed:
        checkout = CheckoutService.confirm_buyer_authorization(
            db=db,
            checkout_id=checkout.id,
            session_id=effective_session_id,
            buyer_confirmed=True,
        )

    return _to_checkout_response(checkout)


@router.get("/session", response_model=CheckoutSessionResponse, summary="Get active checkout session")
def get_checkout_session(
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> CheckoutSessionResponse:
    """Retrieve the current active checkout session for a buyer."""
    effective_session_id = x_session_id or session_id
    if not effective_session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "MISSING_SESSION_ID", "message": "X-Session-ID header or session_id query param is required."}
        )

    checkout = (
        db.query(CheckoutSession)
        .filter(CheckoutSession.session_id == effective_session_id)
        .order_by(CheckoutSession.created_at.desc())
        .first()
    )

    if not checkout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CHECKOUT_NOT_FOUND", "message": "No checkout session found for this session."}
        )

    return _to_checkout_response(checkout)
