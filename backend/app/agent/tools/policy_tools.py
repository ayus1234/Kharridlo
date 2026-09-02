from typing import Dict, Any
from app.agent.context import AgentRequestContext
from app.services.policy_service import PolicyService


def evaluate_policy(context: AgentRequestContext) -> Dict[str, Any]:
    """
    Deterministically evaluate whether the buyer's current cart satisfies commerce policy rules.
    Session identity is bound strictly from the server application context.
    The AI cannot provide or override spending caps, policy tiers, or decisions.
    """
    db = context.db
    eval_result = PolicyService.evaluate_cart(db, context.session_id)

    reasons = []
    for r in eval_result.reasons:
        reasons.append({
            "code": r.code,
            "message": r.message,
            "threshold_paise": r.threshold_paise,
            "observed_paise": r.observed_paise,
        })

    return {
        "success": True,
        "decision": eval_result.decision,  # "ALLOW", "BLOCK", or "AUTHORIZATION_REQUIRED"
        "policy_tier": eval_result.policy_tier,
        "cart_total_paise": eval_result.cart_total_paise,
        "cart_total_inr": eval_result.cart_total_inr,
        "max_single_transaction_paise": eval_result.max_single_transaction_paise,
        "max_single_transaction_inr": eval_result.max_single_transaction_inr,
        "remaining_buffer_paise": eval_result.remaining_buffer_paise,
        "remaining_buffer_inr": eval_result.remaining_buffer_inr,
        "authorization_required": eval_result.authorization_required,
        "payment_initiated": False,
        "reasons": reasons,
    }
