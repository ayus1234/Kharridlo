# Kharridlo — Product Specification

## 1. Product Identity

* **Product Name:** Kharridlo
* **Tagline:** From AI intent to trusted transactions.
* **Name Meaning:** 
  * **Kharridlo (ख़रीद लो):** Colloquial Hindi for *"Buy it / Purchase it"*, embodying decisive, frictionless, and confident agentic commerce.
  * Formerly known as *DhanKriya* (Dhan = economic value, Kriya = purposeful execution).
  * Together, **Kharridlo** embodies intelligent, bounded, and trusted action: *From AI intent to trusted transactions.*
* **Buildathon:** Razorpay AI Buildathon
* **Track:** Track 01 — AI Growth & Agentic Commerce

### Product One-Liner
> Kharridlo is an AI-native commerce agent that enables AI buyers to discover products, receive contextual recommendations, make bounded purchase decisions, and complete Razorpay-powered transactions while helping merchants grow and understand AI-assisted revenue.

---

## 2. Problem Statement

Traditional e-commerce platforms and storefronts are designed strictly around human manual browsing: pagination, category filters, endless product detail pages, and manual cart checkout forms.

While modern conversational AI assistants can understand complex user intent and recommend products in natural language, merchants lack the infrastructure to make their stores **AI-readable and AI-transactable**. When an AI buyer attempts to fulfill a shopping goal:
1. **Catalog Inaccessibility:** Catalogs are optimized for human eyes rather than structured machine reasoning.
2. **Lack of Autonomous Yet Bounded Payment Rails:** AI agents cannot be given unlimited financial authority to execute purchases without strict constraints.
3. **Absence of Explainable Auditability:** Financial actions taken by an agent need transparent, gated, and auditable verification.
4. **Merchant Invisibility:** Merchants currently have zero visibility into AI-assisted commerce sessions, conversion drop-offs, or revenue opportunities driven by AI buyers.

Kharridlo bridges this gap directly:
$$\text{AI Buyer Intent} \longrightarrow \text{Merchant Catalog} \longrightarrow \text{Bounded Decision Gate} \longrightarrow \text{Razorpay Payment} \longrightarrow \text{Measurable Merchant Revenue}$$

---

## 3. Solution Overview

Kharridlo creates a dual-sided, AI-native commerce platform:

1. **AI Buyer Interface:** Customers interact conversationally with a specialized commerce agent using natural language (e.g., *"I need a laptop for AI development under ₹70,000 with at least 16GB RAM"*). The agent understands requirements, retrieves real-time catalog specs, compares products, suggests contextual upgrades, checks deterministic safety policies, requests human confirmation where needed, and completes a bounded Razorpay test-mode transaction.
2. **Merchant Intelligence Dashboard:** Merchants gain full visibility into AI-assisted shopping sessions, conversion metrics, average order value (AOV), upsell acceptance rates, blocked unsafe transactions, and receive AI-driven actionable revenue growth recommendations.

---

## 4. Track 01 Alignment: AI Growth & Agentic Commerce

### AI Growth
Kharridlo actively drives merchant revenue through:
* **Contextual Upselling:** Recommending logical specification upgrades (e.g., 16GB RAM upgrade for development workloads) with explicit explanations.
* **Cross-Selling & Bundling:** Intelligently pairing complementary accessories (e.g., precision mouse or ergonomic stand with a development laptop).
* **AI Merchant Optimization Agent:** Analyzing transaction patterns and drop-offs to recommend specific catalog merchandising improvements to merchants.

### Agentic Commerce
Kharridlo implements an end-to-end agentic transaction pipeline:
$$\text{Buyer Intent} \rightarrow \text{Product Discovery} \rightarrow \text{Comparison} \rightarrow \text{Recommendation} \rightarrow \text{Cart Planning} \rightarrow \text{Policy Validation} \rightarrow \text{User Authorization} \rightarrow \text{Razorpay Checkout} \rightarrow \text{Order Confirmation}$$

### AI-Readable Commerce
Exposes structured, machine-readable catalog and checkout endpoints (`/ai/catalog`, `/ai/search`, `/ai/cart`, `/ai/order`, `/ai/checkout`), enabling any external AI agent to browse and transact securely.

### Explainable, Bounded & Gated Safety
All monetary actions follow strict safety boundaries. The LLM cannot execute financial transactions autonomously without satisfying deterministic policy rules and tiered human confirmation thresholds.

---

## 5. Core Product Features

### A. AI Buyer Experience
* **Natural Language Shopping:** Declarative intent capture without manual multi-filter browsing.
* **Intent Extraction:** Structured parsing of constraints (budget, specs, use case, brand preferences).
* **Product Discovery & Comparison:** Specification matrices highlighting trade-offs across suitable products.
* **Contextual Recommendations:** Explainable justifications answering *"Why this product fits you"*.
* **Interactive Follow-ups:** Dynamic resolution of user questions regarding battery life, ports, or benchmarks.

### B. AI Commerce Engine
* **Smart Cart:** Dynamic calculation of subtotal, applicable discounts, and bundle incentives.
* **Contextual Upsell & Cross-Sell:** Relevant accessories suggested with transparent rationale; never added silently.
* **AI-Readable Catalog:** Structured schemas conveying attributes, stock availability, and constraints.
* **Agentic Commerce APIs:** Standardized endpoints for agent-to-agent transactions.

### C. Payment Integration (Razorpay Test Mode)
* **Server-Side Order Creation:** Orders generated via Razorpay Orders API with strict amount verification.
* **Standard Checkout Modal:** Interactive test payment gateway processing cards, UPI, and net banking.
* **Cryptographic Signature Verification:** Server-side validation of `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`.
* **Idempotent State Machine:** Prevention of double-charge scenarios (`CREATED` $\rightarrow$ `PENDING` $\rightarrow$ `PAID` $\rightarrow$ `FULFILLED`).
* **Webhook Processing:** Asynchronous capture and status updates.

### D. Commerce Policy & Safety Gate
* **Deterministic Policy Engine:** Hard rules outside the LLM context that cannot be bypassed.
* **Spending Limits:** Maximum single-transaction cap (e.g., ₹70,000) and daily rolling limits.
* **Quantity Bounds:** Strict item quantity maximums to prevent unintended bulk commitments.
* **Tiered Human-in-the-Loop Thresholds:**
  * ₹0 – ₹10,000: Auto-approved within active session.
  * ₹10,000 – ₹50,000: Explicit user confirmation dialog required.
  * ₹50,000+: Strong confirmation with full policy breakdown and review.
  * Over-limit: Hard rejection with zero payment tool invocation.
* **Prompt-Injection Defense:** Catalog descriptions and user messages treated as untrusted data inputs.

### E. Merchant Intelligence Dashboard
* **AI-Assisted Revenue Metrics:** Real-time tracking of AI-driven gross merchandise value (GMV).
* **Conversion Analytics:** Funnel analysis from AI query to recommendation to completed checkout.
* **AOV & Upsell Acceptance:** Measurement of uplift generated by contextual recommendations.
* **Blocked Unsafe Actions:** Log of intercepted transactions exceeding buyer or store policies.
* **AI Revenue Advisor:** Merchant-facing intelligence agent proposing data-backed store optimizations.

### F. Explainable Audit Trail
* **Immutable Decision Timeline:** Microsecond-level timestamped records for every step: intent parsing, catalog query, candidate selection, policy evaluation, authorization, order creation, payment response.
* **Zero Hidden Reasoning:** Clear audit entries demonstrating why transactions passed or failed.

---

## 6. Representative User Flows

### Flow 1: Successful Bounded Transaction
```text
User: "I need a laptop for AI development under ₹70,000."
  ↓
Agent understands intent (Budget: ₹70k, Workload: AI/ML, RAM: ≥16GB)
  ↓
Tool Call: search_products(category='laptop', max_price=70000, min_ram=16)
  ↓
3 matching products returned and compared
  ↓
Agent recommends Laptop Pro 15 (₹64,999) with explicit suitability justification
  ↓
Contextual Cross-sell: Suggests Precision Wireless Mouse (₹1,499)
  ↓
User accepts bundle → Cart total: ₹66,498
  ↓
Deterministic Policy Check:
  - Budget Limit: ₹70,000 [PASSED - Remaining: ₹3,502]
  - Merchant Allowed: TechNova Store [PASSED]
  - Inventory Available: [PASSED]
  - Spending Tier: Requires User Confirmation [PASSED]
  ↓
User confirms purchase
  ↓
Server creates Razorpay Order (Amount: ₹66,498 in paise)
  ↓
Razorpay Standard Checkout opens in Test Mode
  ↓
Payment simulated successfully (Payment ID: pay_test_10042)
  ↓
Server cryptographically verifies signature
  ↓
Order marked PAID and audit log persisted
```

### Flow 2: Blocked Transaction (Deliberate Safety Violation)
```text
User: "Buy me the MacBook Pro for ₹1,49,000."
  ↓
Agent identifies requested item: Laptop Ultra (₹1,49,000)
  ↓
Price & inventory verified
  ↓
Deterministic Policy Check:
  - Requested Amount: ₹1,49,000
  - Buyer Spending Limit: ₹70,000
  - Evaluation: VIOLATION DETECTED
  ↓
POLICY DECISION: TRANSACTION BLOCKED
  ↓
Razorpay API is NOT called
  ↓
Explainable Audit Entry Created:
  - Timestamp: 14:35:11
  - Action: BLOCKED
  - Reason: Amount ₹1,49,000 exceeds buyer ceiling of ₹70,000
  ↓
User Interface presents clean safety card with explanation and under-budget alternatives
```

---

## 7. Failure Handling & Resilience

The system guarantees graceful handling across all commerce failure modes:

| Scenario | Root Cause | System Response |
| :--- | :--- | :--- |
| **Payment Failure** | Declined test card / network drop | State marked `FAILED`. Agent explains specific decline reason and offers non-blind retry or cart review. Never retries automatically. |
| **Duplicate Payment** | Double-click or network retry | Idempotency key checked against order state machine. Repeat requests return existing order status; double-charging is blocked. |
| **Out-of-Stock** | Inventory depleted before checkout | Inventory tool halts flow; agent automatically surfaces top-2 equivalent available alternatives with matched specs. |
| **Prompt Injection** | Malicious product text attempting override | System prompts isolate catalog data into untrusted payload blocks. Directives in descriptions are parsed as text, never executed. |
| **API Timeout** | Upstream payment gateway latency | Transaction placed in `PENDING_VERIFICATION` state. Asynchronous webhook handles final reconciliation. |

---

## 8. AI System Design Principles

1. **AI Proposes, Code Authorizes:** The generative AI model determines intent, ranks candidates, and formulates cart proposals. Deterministic code enforces budgets, inventory, signatures, and payments.
2. **Untrusted Data Isolation:** All external inputs (user chat, catalog descriptions, merchant notes) are treated as untrusted data inputs and strictly validated with Pydantic schemas.
3. **No Unbounded Monetary Access:** LLMs never receive Razorpay secret keys, account access, or unrestricted payment execution tools.

---

## 9. Planned Technology Stack

* **Frontend:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
* **Backend:** Python, FastAPI, Pydantic, SQLAlchemy
* **AI & Agents:** Google Gemini API, Google ADK (Agent Development Kit)
* **Database & Cache:** PostgreSQL, Redis
* **Payments:** Razorpay Test Mode APIs (Orders, Checkout, Webhooks)
* **Authentication:** Firebase Authentication
* **Cloud Infrastructure:** Google Cloud Run, Google Cloud Storage, Cloud Logging & Monitoring
* **Observability:** OpenTelemetry
* **Testing & Quality:** Pytest, Playwright
* **DevOps:** Git, GitHub, Docker

---

## 10. Scope Boundaries

### In Scope for Initial Build:
1. End-to-end AI conversational shopping and specification comparison.
2. Contextual upselling and cross-selling engine.
3. Deterministic policy and human-in-the-loop safety gate.
4. Genuine Razorpay Test Mode order creation, checkout, and verification.
5. Merchant intelligence analytics dashboard and AI revenue advisor.
6. Real-time explainable audit trail.
7. Synthetic evaluation benchmark testing failure and compliance scenarios.

### Explicitly Out of Scope:
* Real money live payments (strictly test mode).
* Native mobile applications (responsive web design covers mobile viewports).
* Multi-vendor marketplaces (focused synthetic merchant catalog of 50–100 products).
* Cryptocurrency or unnecessary external blockchain protocols.
* Complex distributed microservices (modular monolith on FastAPI + Next.js).

---

## 11. Future Extensions
* Cross-merchant AI commerce protocols (e.g., UCP/ACP compatibility).
* Multi-modal voice shopping integration.
* Automated dynamic merchant price optimization.
