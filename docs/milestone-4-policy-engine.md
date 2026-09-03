# Kharridlo — Milestone 4: Deterministic Commerce Policy Engine

## 1. Milestone Objective

Milestone 4 implements the deterministic commerce policy engine and buyer authorization security gate in **Kharridlo** for the **Razorpay AI Buildathon (Track 01: AI Growth & Agentic Commerce)**.

The policy engine acts as the authoritative trust boundary between commerce intent/cart formulation and future payment gateway execution:

```
[Synthetic Catalog] (M2)
        │
        ▼
[Deterministic Cart] (M3)
        │
        ▼
[Deterministic Policy Engine] <--- MILESTONE 4 (You are here)
        │
        ▼
[Buyer Authorization Gate]
        │
        ▼
[Razorpay Payment Pipeline] (M6 - Future)
```

### Core Project Principle Enforced
> **"AI proposes. Deterministic systems verify and authorize."**

In Kharridlo, AI shopping agents may propose complex product bundles or cart additions, but **the AI has zero authority over policy decisions or money**. All policy checks are executed deterministically by the backend using integer-paise financial bounds. The policy engine is strictly read-only with respect to cart and inventory state, and payment is never initiated before all required gates pass.

---

## 2. Policy Architecture & Trust Boundary

```
                     ┌───────────────────────────────┐
                     │       Buyer / AI Proposal     │
                     └───────────────┬───────────────┘
                                     │
                                     ▼
                     ┌───────────────────────────────┐
                     │   Authoritative Cart (M3)     │
                     │  - Total stored in paise      │
                     │  - Real-time inventory locked │
                     └───────────────┬───────────────┘
                                     │
                                     ▼
                     ┌───────────────────────────────┐
                     │  DETERMINISTIC POLICY ENGINE  │
                     │                               │
                     │  [Rule 1] Cart Exists         │
                     │  [Rule 2] Cart Active (TTL)   │
                     │  [Rule 3] Cart Not Empty      │
                     │  [Rule 4] Cart Valid          │
                     │  [Rule 5] Single-Txn Cap      │
                     │  [Rule 6] Cart Spending Cap   │
                     │  [Rule 7] Buyer Auth Gate     │
                     └───────────────┬───────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
    ┌──────────────────────────┐           ┌──────────────────────────┐
    │          BLOCK           │           │  AUTHORIZATION_REQUIRED  │
    │  - Hard Stop             │           │  - Policy Passed         │
    │  - Explainable Violation │           │  - Budget Buffer Shown   │
    │  - ZERO Payment Calls    │           │  - Explicit Buyer Review │
    └──────────────────────────┘           └─────────────┬────────────┘
                                                         │
                                                         ▼
                                           ┌──────────────────────────┐
                                           │ Explicit Buyer Approval  │
                                           │  - Human in the Loop     │
                                           │  - Future: Razorpay (M6) │
                                           └──────────────────────────┘
```

---

## 3. Supported Policy Tiers

All limits are stored and evaluated in **authoritative integer paise** (₹1 = 100 paise) with zero floating-point arithmetic:

| Policy Tier | Max Single Transaction | Max Cart Spending | Authorization Required | Target Persona / Use-Case |
| :--- | :---: | :---: | :---: | :--- |
| **RESTRICTED** | ₹25,000.00 *(2,500,000 paise)* | ₹25,000.00 *(2,500,000 paise)* | `True` | First-time buyers, low-trust trial sessions. |
| **STANDARD** *(Default)* | ₹70,000.00 *(7,000,000 paise)* | ₹70,000.00 *(7,000,000 paise)* | `True` | Standard developer and professional buyer sessions. |
| **ELEVATED** | ₹1,50,000.00 *(15,000,000 paise)* | ₹1,50,000.00 *(15,000,000 paise)* | `True` | Verified high-autonomy enterprise / power users. |

---

## 4. Deterministic Rules & Execution Order

Rules are evaluated in strict, sequential order. The engine stops and issues a `BLOCK` decision at the first failing rule:

1. **RULE 1 — Cart Existence**:
   * Condition: Cart must exist for the given session.
   * On failure: `BLOCK` (`CART_NOT_FOUND`).
2. **RULE 2 — Cart Active Status**:
   * Condition: Cart must not be expired (`cart.status != "expired"` and `expires_at > NOW()`).
   * On failure: `BLOCK` (`CART_EXPIRED`).
3. **RULE 3 — Cart Not Empty**:
   * Condition: Cart must contain at least 1 item and `total_paise > 0`.
   * On failure: `BLOCK` (`EMPTY_CART`).
4. **RULE 4 — Cart Internal Validity**:
   * Condition: Fulfillability check against active products and real-time inventory.
   * On failure: `BLOCK` (`CART_INVALID`).
5. **RULE 5 — Single Transaction Cap**:
   * Condition: `cart.total_paise <= policy.max_single_transaction_paise`.
   * On failure: `BLOCK` (`SINGLE_TRANSACTION_LIMIT_EXCEEDED`).
6. **RULE 6 — Cart Spending Cap**:
   * Condition: `cart.total_paise <= policy.max_cart_total_paise`.
   * On failure: `BLOCK` (`CART_SPENDING_LIMIT_EXCEEDED`).
7. **RULE 7 — Buyer Authorization Gate**:
   * Condition: All rules passed. If `policy.authorization_required == True`, return `AUTHORIZATION_REQUIRED`; otherwise return `ALLOW`.

---

## 5. Machine-Readable Policy Decision States

* **`ALLOW`**: Transaction satisfies all deterministic policy requirements and does not require an additional human gate.
* **`AUTHORIZATION_REQUIRED`**: Transaction is approved by commerce policy, but requires explicit buyer confirmation before proceeding to payment.
* **`BLOCK`**: Transaction violates a deterministic policy rule. Execution halts immediately. **Payment is never initiated.**

---

## 6. Explainable Structured Facts (No Chain-of-Thought)

Policy explanations contain only structured, auditable facts:

```json
{
  "decision": "AUTHORIZATION_REQUIRED",
  "policy_tier": "STANDARD",
  "session_id": "sess_demo_101",
  "cart_id": "cart_uuid_101",
  "cart_total_paise": 6649800,
  "cart_total_inr": 66498.0,
  "max_single_transaction_paise": 7000000,
  "max_single_transaction_inr": 70000.0,
  "remaining_buffer_paise": 350200,
  "remaining_buffer_inr": 3502.0,
  "authorization_required": true,
  "payment_initiated": false,
  "reasons": [
    {
      "code": "WITHIN_SINGLE_TRANSACTION_LIMIT",
      "message": "Cart total ₹66,498.00 is within the single-transaction limit of ₹70,000.00.",
      "threshold_paise": 7000000,
      "observed_paise": 6649800
    },
    {
      "code": "WITHIN_CART_SPENDING_LIMIT",
      "message": "Cart total is within maximum spending cap. Remaining budget buffer: ₹3,502.00.",
      "threshold_paise": 7000000,
      "observed_paise": 6649800
    },
    {
      "code": "BUYER_AUTHORIZATION_REQUIRED",
      "message": "Commerce policy approved this transaction. Explicit buyer review and approval is required before payment initiation."
    }
  ]
}
```

For blocked transactions:

```json
{
  "decision": "BLOCK",
  "policy_tier": "STANDARD",
  "cart_total_paise": 14900000,
  "max_single_transaction_paise": 7000000,
  "payment_initiated": false,
  "reasons": [
    {
      "code": "SINGLE_TRANSACTION_LIMIT_EXCEEDED",
      "message": "Cart total ₹149,000.00 (14900000 paise) exceeds single-transaction limit of ₹70,000.00 (7000000 paise).",
      "threshold_paise": 7000000,
      "observed_paise": 14900000
    }
  ]
}
```

---

## 7. REST API Endpoints (`/api/v1/policy`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/policy/tiers` | Returns list of all available policy tiers and spending limits. |
| `GET` | `/api/v1/policy/{session_id}` | Retrieves active policy configuration for the given session. |
| `POST` | `/api/v1/policy/evaluate/{session_id}` | Deterministically evaluates the active cart without mutating state. |
| `POST` | `/api/v1/policy/{session_id}/tier` | Switches policy tier for a session (for testing & demo scenarios). |

---

## 8. Demo Scenarios Verified

| Scenario | Input Items | Cart Total | Policy Tier | Policy Decision | Explanation / Reason |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Scenario A: Safe Purchase** | `DK-LP-15` (Laptop Pro 15) | ₹64,999.00 | STANDARD (₹70k) | **`AUTHORIZATION_REQUIRED`** | Within limit with ₹5,001 buffer. |
| **Scenario B: Safe Bundle** | `DK-LP-15` + `DK-MS-01` | ₹66,498.00 | STANDARD (₹70k) | **`AUTHORIZATION_REQUIRED`** | Within limit with ₹3,502 buffer. |
| **Scenario C: Policy Block** | `DK-LP-ULTRA` (Laptop Ultra 16) | ₹1,49,000.00 | STANDARD (₹70k) | **`BLOCK`** | Exceeds ₹70,000 single transaction cap. |
| **Exact Upper Boundary** | Synthetic Item | ₹70,000.00 *(7,000,000 p)* | STANDARD (₹70k) | **`AUTHORIZATION_REQUIRED`** | Exact boundary permitted (₹0 buffer). |
| **One Paise Above Boundary** | Synthetic Item | ₹70,000.01 *(7,000,001 p)* | STANDARD (₹70k) | **`BLOCK`** | Single paise excess blocked. |
| **Tier Switch (Elevated)** | `DK-LP-ULTRA` (Laptop Ultra 16) | ₹1,49,000.00 | ELEVATED (₹1.5L) | **`AUTHORIZATION_REQUIRED`** | Permitted under ₹1,50,000 cap. |
| **Tier Switch (Restricted)** | `DK-LP-15` (Laptop Pro 15) | ₹64,999.00 | RESTRICTED (₹25k) | **`BLOCK`** | Exceeds ₹25,000 cap. |
| **Empty Cart** | No items | ₹0.00 | STANDARD (₹70k) | **`BLOCK`** | `EMPTY_CART` |
| **Expired Cart** | Expired session | — | STANDARD (₹70k) | **`BLOCK`** | `CART_EXPIRED` |

---

## 9. Security Invariants & Non-Negotiables

1. **Zero Client Trust:** Clients cannot submit custom thresholds, alter spending caps, or send `decision: "ALLOW"`. All thresholds and decisions are strictly resolved by the backend.
2. **Read-Only Invariant:** Policy evaluation does not mutate cart items, line totals, subtotal, cart total, available inventory, or reserved inventory.
3. **No Payment Initiation:** The field `payment_initiated: false` is permanently enforced. Payment integration is strictly deferred to Milestone 6.
4. **No LLM in Policy Loop:** AI agents propose cart actions via tool calls, but cannot evaluate or approve policies.
5. **No Policy Overrides:** There are no backdoor override endpoints (`/override`, `/force-allow`).

---

## 10. Automated Test Results (36 / 36 Passing)

```text
tests\test_cart.py ..............                                        [ 38%]
tests\test_catalog.py .........                                          [ 63%]
tests\test_health.py ...                                                 [ 72%]
tests\test_policy.py ..........                                          [100%]
======================== 36 passed, 1 warning in 3.07s ========================
```

---

## 11. Next Milestone: Milestone 5

With the Catalog (M2), Cart (M3), and Policy Engine (M4) complete and verified, **Milestone 5** will implement the **AI Agent & Google ADK Tool Integration** (where Gemini models can propose product searches and cart additions through bounded, deterministic tool schemas).
