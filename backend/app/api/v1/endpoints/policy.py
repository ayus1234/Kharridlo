from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.policy_service import PolicyService
from app.schemas.policy import (
    PolicySummary,
    PolicyEvaluationResponse,
    SetSessionPolicyRequest,
)

router = APIRouter(prefix="/policy", tags=["Policy Engine"])


@router.get("/tiers", response_model=List[PolicySummary])
def list_policy_tiers(db: Session = Depends(get_db)) -> List[PolicySummary]:
    """List all supported deterministic commerce policy tiers and spending limits."""
    return PolicyService.get_all_tiers(db)


@router.get("/{session_id}", response_model=PolicySummary)
def get_session_policy(session_id: str, db: Session = Depends(get_db)) -> PolicySummary:
    """Retrieve the authoritative policy configuration assigned to the given session."""
    policy = PolicyService.get_policy_for_session(db, session_id)
    return PolicySummary.model_validate(policy)


@router.post("/evaluate/{session_id}", response_model=PolicyEvaluationResponse)
def evaluate_cart_policy(session_id: str, db: Session = Depends(get_db)) -> PolicyEvaluationResponse:
    """
    Deterministically evaluates current cart against session policy rules.
    Read-only with respect to cart and inventory.
    Does NOT initiate payment or invoke payment gateways.
    """
    return PolicyService.evaluate_cart(db, session_id)


@router.post("/{session_id}/tier", response_model=PolicySummary)
def set_session_policy_tier(
    session_id: str,
    payload: SetSessionPolicyRequest,
    db: Session = Depends(get_db),
) -> PolicySummary:
    """Assign or switch policy tier for a session (useful for demonstration and test scenarios)."""
    try:
        PolicyService.set_session_policy(db, session_id, payload.tier)
        updated_policy = PolicyService.get_policy_for_session(db, session_id)
        return PolicySummary.model_validate(updated_policy)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_POLICY_TIER", "message": str(e)},
        )
