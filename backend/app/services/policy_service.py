from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from app.models.policy import Policy, SessionPolicy
from app.models.cart import Cart
from app.services.cart_service import CartService
from app.schemas.policy import (
    PolicySummary,
    PolicyRuleReason,
    PolicyEvaluationResponse,
)
from app.services.audit_service import AuditService
from app.schemas.audit import AuditEventType

# Standard default policy configurations (in integer paise)
DEFAULT_POLICIES: Dict[str, dict] = {
    "STANDARD": {
        "name": "Standard Commerce Tier",
        "description": "Standard buyer policy with ₹70,000 single-transaction and cart spending limits.",
        "max_single_transaction_paise": 7000000,  # ₹70,000.00
        "max_cart_total_paise": 7000000,          # ₹70,000.00
        "authorization_required": True,
        "is_active": True,
    },
    "ELEVATED": {
        "name": "Elevated Autonomy Tier",
        "description": "High-value developer policy with ₹1,50,000 single-transaction limit.",
        "max_single_transaction_paise": 15000000,  # ₹1,50,000.00
        "max_cart_total_paise": 15000000,          # ₹1,50,000.00
        "authorization_required": True,
        "is_active": True,
    },
    "RESTRICTED": {
        "name": "Restricted Trial Tier",
        "description": "Strict low-risk policy with ₹25,000 limit.",
        "max_single_transaction_paise": 2500000,  # ₹25,000.00
        "max_cart_total_paise": 2500000,          # ₹25,000.00
        "authorization_required": True,
        "is_active": True,
    },
}


class PolicyService:

    @classmethod
    def ensure_default_policies(cls, db: Session) -> None:
        """Seed default policy tiers into database if not present."""
        for tier_key, config in DEFAULT_POLICIES.items():
            existing = db.query(Policy).filter(Policy.tier == tier_key).first()
            if not existing:
                policy = Policy(
                    tier=tier_key,
                    name=config["name"],
                    description=config["description"],
                    max_single_transaction_paise=config["max_single_transaction_paise"],
                    max_cart_total_paise=config["max_cart_total_paise"],
                    authorization_required=config["authorization_required"],
                    is_active=config["is_active"],
                )
                db.add(policy)
        db.commit()

    @classmethod
    def get_all_tiers(cls, db: Session) -> List[PolicySummary]:
        """List all available policy tiers and thresholds."""
        cls.ensure_default_policies(db)
        policies = db.query(Policy).filter(Policy.is_active == True).order_by(Policy.max_single_transaction_paise.asc()).all()
        return [PolicySummary.model_validate(p) for p in policies]

    @classmethod
    def get_policy_for_session(cls, db: Session, session_id: str) -> Policy:
        """Resolve authoritative policy for a given session. Defaults to STANDARD tier."""
        cls.ensure_default_policies(db)
        session_policy = db.query(SessionPolicy).filter(SessionPolicy.session_id == session_id).first()
        tier_to_use = session_policy.policy_tier if session_policy else "STANDARD"

        policy = db.query(Policy).filter(Policy.tier == tier_to_use, Policy.is_active == True).first()
        if not policy:
            # Fallback to STANDARD
            policy = db.query(Policy).filter(Policy.tier == "STANDARD").first()

        return policy

    @classmethod
    def set_session_policy(cls, db: Session, session_id: str, tier: str) -> SessionPolicy:
        """Explicitly set policy tier for session (useful for multi-scenario testing/demos)."""
        cls.ensure_default_policies(db)
        upper_tier = tier.strip().upper()
        if upper_tier not in DEFAULT_POLICIES:
            raise ValueError(f"Invalid policy tier '{tier}'. Must be one of: {list(DEFAULT_POLICIES.keys())}")

        session_policy = db.query(SessionPolicy).filter(SessionPolicy.session_id == session_id).first()
        if session_policy:
            session_policy.policy_tier = upper_tier
        else:
            session_policy = SessionPolicy(session_id=session_id, policy_tier=upper_tier)
            db.add(session_policy)

        db.commit()
        db.refresh(session_policy)
        return session_policy

    @classmethod
    def evaluate_cart(cls, db: Session, session_id: str) -> PolicyEvaluationResponse:
        """
        Deterministically evaluates the active cart against policy rules.
        CRITICAL INVARIANT: READ-ONLY with respect to Cart and Inventory.
        Does NOT alter cart items, totals, inventory, or reservations.
        Does NOT initiate payment or invoke Razorpay.
        """
        policy = cls.get_policy_for_session(db, session_id)
        cart = CartService.get_cart(db, session_id)

        # Baseline response facts
        cart_id = cart.id if cart else None
        cart_total_paise = cart.total_paise if cart else 0
        reasons: List[PolicyRuleReason] = []

        # =====================================================================
        # RULE 1 — Cart Existence
        # =====================================================================
        if not cart:
            return PolicyEvaluationResponse(
                decision="BLOCK",
                policy_tier=policy.tier,
                session_id=session_id,
                cart_id=None,
                cart_total_paise=0,
                max_single_transaction_paise=policy.max_single_transaction_paise,
                max_cart_total_paise=policy.max_cart_total_paise,
                remaining_buffer_paise=policy.max_single_transaction_paise,
                authorization_required=policy.authorization_required,
                payment_initiated=False,
                reasons=[
                    PolicyRuleReason(
                        code="CART_NOT_FOUND",
                        message="No active cart session exists for evaluation.",
                    )
                ],
            )

        # =====================================================================
        # RULE 2 — Cart Active / Expiration Status
        # =====================================================================
        if cart.status == "expired" or cart.is_expired:
            return PolicyEvaluationResponse(
                decision="BLOCK",
                policy_tier=policy.tier,
                session_id=session_id,
                cart_id=cart.id,
                cart_total_paise=cart.total_paise,
                max_single_transaction_paise=policy.max_single_transaction_paise,
                max_cart_total_paise=policy.max_cart_total_paise,
                remaining_buffer_paise=max(0, policy.max_single_transaction_paise - cart.total_paise),
                authorization_required=policy.authorization_required,
                payment_initiated=False,
                reasons=[
                    PolicyRuleReason(
                        code="CART_EXPIRED",
                        message="Cart session has expired. All temporary stock holds were released.",
                        threshold_paise=None,
                        observed_paise=None,
                    )
                ],
            )

        # =====================================================================
        # RULE 3 — Empty Cart Check
        # =====================================================================
        if len(cart.items) == 0 or cart.total_paise <= 0:
            return PolicyEvaluationResponse(
                decision="BLOCK",
                policy_tier=policy.tier,
                session_id=session_id,
                cart_id=cart.id,
                cart_total_paise=0,
                max_single_transaction_paise=policy.max_single_transaction_paise,
                max_cart_total_paise=policy.max_cart_total_paise,
                remaining_buffer_paise=policy.max_single_transaction_paise,
                authorization_required=policy.authorization_required,
                payment_initiated=False,
                reasons=[
                    PolicyRuleReason(
                        code="EMPTY_CART",
                        message="Cart contains no items. Add products to evaluate commerce policy.",
                        threshold_paise=None,
                        observed_paise=0,
                    )
                ],
            )

        # =====================================================================
        # RULE 4 — Cart Internal Validity Check
        # =====================================================================
        is_valid, validation_issues, _ = CartService.validate_cart(db, session_id)
        if not is_valid:
            issue_descriptions = "; ".join(i["message"] for i in validation_issues)
            return PolicyEvaluationResponse(
                decision="BLOCK",
                policy_tier=policy.tier,
                session_id=session_id,
                cart_id=cart.id,
                cart_total_paise=cart.total_paise,
                max_single_transaction_paise=policy.max_single_transaction_paise,
                max_cart_total_paise=policy.max_cart_total_paise,
                remaining_buffer_paise=max(0, policy.max_single_transaction_paise - cart.total_paise),
                authorization_required=policy.authorization_required,
                payment_initiated=False,
                reasons=[
                    PolicyRuleReason(
                        code="CART_INVALID",
                        message=f"Cart has unfulfillable items: {issue_descriptions}",
                    )
                ],
            )

        # =====================================================================
        # RULE 5 — Single Transaction Limit Check
        # =====================================================================
        if cart.total_paise > policy.max_single_transaction_paise:
            formatted_total = f"₹{cart.total_paise / 100:,.2f}"
            formatted_limit = f"₹{policy.max_single_transaction_paise / 100:,.2f}"
            return PolicyEvaluationResponse(
                decision="BLOCK",
                policy_tier=policy.tier,
                session_id=session_id,
                cart_id=cart.id,
                cart_total_paise=cart.total_paise,
                max_single_transaction_paise=policy.max_single_transaction_paise,
                max_cart_total_paise=policy.max_cart_total_paise,
                remaining_buffer_paise=0,
                authorization_required=policy.authorization_required,
                payment_initiated=False,
                reasons=[
                    PolicyRuleReason(
                        code="SINGLE_TRANSACTION_LIMIT_EXCEEDED",
                        message=f"Cart total {formatted_total} ({cart.total_paise} paise) exceeds single-transaction limit of {formatted_limit} ({policy.max_single_transaction_paise} paise).",
                        threshold_paise=policy.max_single_transaction_paise,
                        observed_paise=cart.total_paise,
                    )
                ],
            )

        # =====================================================================
        # RULE 6 — Cart Spending Cap Check
        # =====================================================================
        if cart.total_paise > policy.max_cart_total_paise:
            formatted_total = f"₹{cart.total_paise / 100:,.2f}"
            formatted_cap = f"₹{policy.max_cart_total_paise / 100:,.2f}"
            return PolicyEvaluationResponse(
                decision="BLOCK",
                policy_tier=policy.tier,
                session_id=session_id,
                cart_id=cart.id,
                cart_total_paise=cart.total_paise,
                max_single_transaction_paise=policy.max_single_transaction_paise,
                max_cart_total_paise=policy.max_cart_total_paise,
                remaining_buffer_paise=0,
                authorization_required=policy.authorization_required,
                payment_initiated=False,
                reasons=[
                    PolicyRuleReason(
                        code="CART_SPENDING_LIMIT_EXCEEDED",
                        message=f"Cart total {formatted_total} exceeds maximum cart spending cap of {formatted_cap}.",
                        threshold_paise=policy.max_cart_total_paise,
                        observed_paise=cart.total_paise,
                    )
                ],
            )

        # =====================================================================
        # RULE 7 — Authorization Gate (All checks passed!)
        # =====================================================================
        remaining_buffer_paise = max(0, policy.max_single_transaction_paise - cart.total_paise)
        reasons.append(
            PolicyRuleReason(
                code="WITHIN_SINGLE_TRANSACTION_LIMIT",
                message=f"Cart total ₹{cart.total_paise / 100:,.2f} is within the single-transaction limit of ₹{policy.max_single_transaction_paise / 100:,.2f}.",
                threshold_paise=policy.max_single_transaction_paise,
                observed_paise=cart.total_paise,
            )
        )
        reasons.append(
            PolicyRuleReason(
                code="WITHIN_CART_SPENDING_LIMIT",
                message=f"Cart total is within maximum spending cap. Remaining budget buffer: ₹{remaining_buffer_paise / 100:,.2f}.",
                threshold_paise=policy.max_cart_total_paise,
                observed_paise=cart.total_paise,
            )
        )

        if policy.authorization_required:
            reasons.append(
                PolicyRuleReason(
                    code="BUYER_AUTHORIZATION_REQUIRED",
                    message="Commerce policy approved this transaction. Explicit buyer review and approval is required before payment initiation.",
                    threshold_paise=None,
                    observed_paise=None,
                )
            )
            final_decision = "AUTHORIZATION_REQUIRED"
        else:
            reasons.append(
                PolicyRuleReason(
                    code="POLICY_PASSED",
                    message="Commerce policy requirements fully satisfied.",
                    threshold_paise=None,
                    observed_paise=None,
                )
            )
            final_decision = "ALLOW"

        AuditService.log_event(
            db=db,
            actor_type="SYSTEM",
            session_id=session_id,
            event_type=AuditEventType.POLICY_EVALUATED.value,
            event_status="succeeded",
            reason_code=final_decision,
            metadata={
                "policy_tier": policy.tier,
                "cart_total_paise": cart.total_paise,
                "decision": final_decision,
                "authorization_required": policy.authorization_required,
            },
        )

        if final_decision == "BLOCK":
            AuditService.log_event(
                db=db,
                actor_type="SYSTEM",
                session_id=session_id,
                event_type=AuditEventType.POLICY_BLOCKED.value,
                event_status="rejected",
                failure_code="POLICY_LIMIT_EXCEEDED",
                recovery_action="ADJUST_CART_QUANTITY_OR_REMOVE_ITEMS",
                metadata={"cart_total_paise": cart.total_paise, "policy_tier": policy.tier},
            )
        elif final_decision == "AUTHORIZATION_REQUIRED":
            AuditService.log_event(
                db=db,
                actor_type="SYSTEM",
                session_id=session_id,
                event_type=AuditEventType.AUTHORIZATION_REQUIRED.value,
                event_status="pending",
                recovery_action="BUYER_AUTHORIZATION_REQUIRED",
                metadata={"cart_total_paise": cart.total_paise, "policy_tier": policy.tier},
            )

        return PolicyEvaluationResponse(
            decision=final_decision,
            policy_tier=policy.tier,
            session_id=session_id,
            cart_id=cart.id,
            cart_total_paise=cart.total_paise,
            max_single_transaction_paise=policy.max_single_transaction_paise,
            max_cart_total_paise=policy.max_cart_total_paise,
            remaining_buffer_paise=remaining_buffer_paise,
            authorization_required=policy.authorization_required,
            payment_initiated=False,
            reasons=reasons,
        )
