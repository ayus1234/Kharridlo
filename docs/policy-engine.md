# DhanKriya — Deterministic Policy Engine & Safety Gate

This document defines the architecture and rule execution logic of the **Deterministic Policy Engine** in **DhanKriya**. It acts as the non-negotiable security boundary separating AI generative reasoning from real-world financial execution.

---

## 1. Core Principle: Fail-Closed Deterministic Governance

```text
               AI Cart Proposal
                      │
                      ▼
┌──────────────────────────────────────────────┐
│          DETERMINISTIC POLICY GATE           │
│                                              │
│   [Rule 1] Inventory Availability Check      │
│   [Rule 2] SKU Quantity Ceiling Check        │
│   [Rule 3] Merchant Authorization Check      │
│   [Rule 4] Single Transaction Cap Check      │
│   [Rule 5] Daily Rolling Spend Check         │
│   [Rule 6] Tiered Human Confirmation Gate    │
└──────────────────────┬───────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
   [PASSED]                       [BLOCKED]
        │                             │
        ▼                             ▼
Generate Signed Token         Raise PolicyBlockedException
Allow Razorpay Order          Zero Payment Gateway Calls
Emit Audit: ALLOW             Emit Audit: BLOCK
```

### Immutable Security Invariants
1. **Zero LLM Authority:** The Gemini model has no access to policy variables and cannot alter spending limits, waive confirmation requirements, or force-approve an order.
2. **Fail-Closed Design:** If the database connection or policy service experiences any error, the transaction is **blocked by default**.
3. **Cryptographic Authorization Tokens:** When a cart passes the policy gate, the backend issues an ephemeral HMAC-signed `authorization_token` valid for 10 minutes. The Razorpay order creation endpoint rejects any request without a valid token.

---

## 2. Hard Rule Specifications

| Rule Identifier | Parameter Name | Default Threshold | Validation Logic | Violation Consequence |
| :--- | :--- | :--- | :--- | :--- |
| **POL-01** | `MAX_SINGLE_TRANSACTION` | `₹70,000.00` | `cart_total <= policy.max_single_transaction` | **HARD BLOCK (`403 POLICY_BLOCKED`)** |
| **POL-02** | `MAX_DAILY_SPEND` | `₹100,000.00` | `daily_cumulative_spend + cart_total <= policy.max_daily_spend` | **HARD BLOCK (`403 POLICY_BLOCKED`)** |
| **POL-03** | `MAX_SKU_QUANTITY` | `2 units` | `item.quantity <= policy.max_quantity_per_sku` for all items | **INPUT REJECTION (`400 BAD_REQUEST`)** |
| **POL-04** | `INVENTORY_LOCK` | Real-time stock | `inventory.stock_count >= item.quantity` | **STOCK BLOCK $\rightarrow$ Alternative Search** |
| **POL-05** | `MERCHANT_WHITELIST` | Whitelisted IDs | `cart.merchant_id in authorized_merchant_ids` | **SECURITY REJECTION (`403 UNAUTHORIZED`)** |

---

## 3. Tiered Human-in-the-Loop Matrix

DhanKriya enforces bounded autonomy via tiered authorization:

```text
Transaction Value:
 ₹0 ────────────────── ₹10,000 ────────────────── ₹50,000 ────────────────── ₹70,000 ────► Above Limit
 │       Tier 1        │        Tier 2           │         Tier 3           │
 │   Auto-Authorized   │   Modal Confirmation   │  High-Value Checklist    │   HARD BLOCK
 │ (Within Session Cap)│   Required             │  Confirmation Required   │ (No Payment Call)
```

* **Tier 1 (₹0 – ₹10,000):** Standard one-click authorization within the conversational flow.
* **Tier 2 (₹10,000 – ₹50,000):** Explicit review modal showing itemized breakdown and refund policy acknowledgment.
* **Tier 3 (₹50,000 – ₹70,000):** Strict high-value gate requiring visual review of the 4 policy checks and active budget buffer indicator.
* **Tier 4 (> ₹70,000):** Absolute safety block. The payment button is disabled and replaced by the **Blocked Transaction Screen** with alternative recommendations.

---

## 4. Evaluation Algorithm Implementation (Python)

```python
class PolicyEvaluationResult(BaseModel):
    decision: Literal["PASSED", "CONFIRMATION_REQUIRED", "BLOCKED"]
    cart_total: Decimal
    spending_limit: Decimal
    remaining_buffer: Decimal
    confirmation_tier: str
    authorization_token: Optional[str] = None
    violation_code: Optional[str] = None
    violation_message: Optional[str] = None
    suggested_alternative_ids: List[str] = []

def evaluate_cart_policy(
    cart: Cart,
    policy: Policy,
    inventory_service: InventoryService,
    audit_service: AuditService
) -> PolicyEvaluationResult:
    # 1. Check inventory availability
    for item in cart.items:
        if not inventory_service.is_in_stock(item.product_id, item.quantity):
            audit_service.log_event("POLICY_BLOCKED", "OUT_OF_STOCK", item.product_id)
            return PolicyEvaluationResult(
                decision="BLOCKED",
                cart_total=cart.total,
                spending_limit=policy.max_single_transaction,
                remaining_buffer=Decimal("0.0"),
                confirmation_tier="NONE",
                violation_code="ERR_OUT_OF_STOCK",
                violation_message=f"Product {item.product_id} is out of stock"
            )

    # 2. Check maximum single transaction spending cap
    if cart.total > policy.max_single_transaction:
        excess = cart.total - policy.max_single_transaction
        alternatives = inventory_service.find_under_budget_alternatives(policy.max_single_transaction)
        audit_service.log_event(
            actor="POLICY_ENGINE",
            action="POLICY_BLOCKED",
            decision="BLOCK",
            metadata={"cart_total": float(cart.total), "limit": float(policy.max_single_transaction), "excess": float(excess)}
        )
        return PolicyEvaluationResult(
            decision="BLOCKED",
            cart_total=cart.total,
            spending_limit=policy.max_single_transaction,
            remaining_buffer=Decimal("0.0"),
            confirmation_tier="NONE",
            violation_code="ERR_SPENDING_LIMIT_EXCEEDED",
            violation_message=f"Cart total of ₹{cart.total} exceeds policy cap of ₹{policy.max_single_transaction}",
            suggested_alternative_ids=alternatives
        )

    # 3. Determine Human-in-the-loop Tier
    if cart.total >= policy.tier3_high_value_threshold:
        tier = "TIER_3_HIGH_VALUE"
    elif cart.total >= policy.tier2_confirmation_threshold:
        tier = "TIER_2_CONFIRMATION"
    else:
        tier = "TIER_1_AUTO"

    # 4. Generate signed cryptographic authorization token
    token = generate_hmac_auth_token(cart.id, cart.total, policy.id)
    buffer = policy.max_single_transaction - cart.total

    audit_service.log_event(
        actor="POLICY_ENGINE",
        action="POLICY_PASSED",
        decision="ALLOW",
        metadata={"cart_total": float(cart.total), "tier": tier, "remaining_buffer": float(buffer)}
    )

    return PolicyEvaluationResult(
        decision="PASSED",
        cart_total=cart.total,
        spending_limit=policy.max_single_transaction,
        remaining_buffer=buffer,
        confirmation_tier=tier,
        authorization_token=token
    )
```

---

## 5. Audit & Compliance Guarantees

Every execution of `evaluate_cart_policy()` records an immutable row in `audit_logs`:
* **On PASS:** Records `PASSED`, the buffer, authorization tier, and generated token hash.
* **On BLOCK:** Records `BLOCKED`, exact violation code, excess amount, and immediately dispatches a real-time event to the **Merchant Control Center** under the **Policy Protection Alerts** stream.
