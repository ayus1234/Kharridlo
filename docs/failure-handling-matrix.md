# DhanKriya — Failure Handling & Resilience Matrix

This document defines the comprehensive failure handling matrix for **DhanKriya**, establishing exact system behaviors, UX responses, merchant observability, and audit records for every possible failure scenario across the commerce lifecycle.

---

## 1. Resilience Philosophy

DhanKriya is built on three core resilience tenets:
1. **Never Fail Open on Money:** If an error occurs in the AI agent, database, or network, the policy engine strictly defaults to **FAIL-CLOSED (BLOCKED)**. No money is moved.
2. **Never Blindly Retry Financial Operations:** Payments that fail are never retried automatically by the agent. Retries require explicit human interaction.
3. **Intentional Safety is Not a Bug:** Guardrail interventions (e.g., stopping a ₹1,49,000 purchase) are styled as proactive safety controls, not system errors.

---

## 2. Master Failure Handling Matrix

| Failure Mode | Root Cause | System Response | User Experience | Merchant Visibility | Audit Event Recorded |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Policy Violation (Over-Budget)** | Attempted purchase exceeds ₹70,000 cap | `PolicyEngine` raises `PolicyBlockedException`. Razorpay Orders API is **NOT** invoked. | Displays **Blocked Transaction Screen** showing excess amount and 2 spec-matched alternatives under ₹70k. | Real-time alert in **Policy Protection Detail** feed (*"₹1.49L attempt blocked"*). | `POLICY_BLOCKED`<br>`REASON: EXCEEDS_CAP` |
| **2. Policy Violation (Excess Quantity)** | Request attempts to buy $>2$ units of SKU | Input validation halts cart creation; resets quantity to max allowed (2). | Explanatory inline toast: *"Maximum 2 units allowed per customer."* | Flagged under high-quantity intent analytics. | `POLICY_BLOCKED`<br>`REASON: QUANTITY_CEILING` |
| **3. Product Out of Stock** | Real-time stock is 0 during checkout check | `check_inventory()` halts cart addition; queries alternatives. | Displays **Out-of-Stock Fallback Screen** with 2 spec-matched alternatives in stock. | Alert in **AI Inventory Recovery Log** (*"Stock depletion handled by agent"*). | `INVENTORY_DEPLETED`<br>`REASON: OUT_OF_STOCK` |
| **4. Test Card Declined** | Test payment rejected in Razorpay modal | Gateway returns decline code; order status remains `PENDING_PAYMENT`. | Displays **Payment Failed Screen** explaining decline reason with `[Retry Test Card]` button. | Flagged as `FAILED_PAYMENT` in Merchant Order Ledger. | `PAYMENT_FAILED`<br>`ERROR: BANK_DECLINE` |
| **5. Signature Verification Mismatch** | Client payload tampered with or corrupted | HMAC-SHA256 signature mismatch; order marked `FAILED_TAMPERED`. | Generic security error: *"Payment verification failed. Please contact support."* | Security warning banner in Merchant Dashboard. | `SECURITY_ALERT`<br>`SIGNATURE_MISMATCH` |
| **6. Duplicate Payment Request** | Network glitch triggers duplicate checkout submission | `Idempotency-Key` header checked against state machine; duplicate call ignored. | User receives existing confirmed order receipt instantly with no duplicate charge. | Single order logged; duplicate request metric incremented. | `IDEMPOTENCY_INTERCEPT`<br>`DUPLICATE_PREVENTED` |
| **7. Razorpay API Timeout** | Upstream payment gateway latency $>10$s | Circuit breaker halts synchronous call; order set to `PENDING_GATEWAY`. | Loading indicator with reassuring text: *"Verifying gateway status... please wait."* | Status shows `PENDING_RECONCILIATION` until webhook arrives. | `GATEWAY_TIMEOUT`<br>`ASYNC_PENDING` |
| **8. Catalog Prompt Injection** | Malicious SKU description contains override text | XML sandboxing isolates text; deterministic policy evaluates price strictly from DB. | Normal product view; injection text rendered as harmless string. | Security inspection drawer highlights neutralized injection string. | `INJECTION_NEUTRALIZED`<br>`UNTRUSTED_DATA_ISOLATED` |
| **9. Malformed AI Tool Output** | LLM outputs invalid JSON or schema mismatch | Pydantic validation rejects tool call; fallback rule returns default catalog query. | Seamless fallback to standard top-selling laptops matching stated budget. | Trace drawer logs `TOOL_CALL_REPAIR` warning. | `TOOL_MALFORMED`<br>`FALLBACK_INVOKED` |
| **10. Agent Service / LLM Outage** | Gemini API unreachable or rate-limited | FastAPI router falls back to deterministic rule-based search engine. | Conversational UI indicates: *"Switching to high-speed catalog search..."* | System health indicator switches from `AI_ACTIVE` to `DEGRADED_RULE_FALLBACK`. | `AGENT_OUTAGE`<br>`RULE_FALLBACK_ACTIVE` |
