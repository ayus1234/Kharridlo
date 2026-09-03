# Kharridlo — Master Technical Implementation Blueprint

## 1. Executive Summary & Product DNA

* **Product Name:** Kharridlo
* **Tagline:** From AI intent to trusted transactions.
* **Buildathon Track:** Razorpay AI Buildathon — **Track 01: AI Growth & Agentic Commerce**
* **Core Mission:** Bridge the critical gap between conversational AI intent and bounded, auditable, real-world financial execution. Kharridlo transforms merchant catalogs into machine-readable, agent-transactable storefronts while giving merchants transparent intelligence on AI-driven revenue, conversion uplift, and safety guardrails.

### The Fundamental Differentiator
Most AI shopping implementations are unconstrained chatbots that end with an affiliate link or a dummy mock modal. **Kharridlo is an agentic commerce runtime**:
1. **AI Proposes, Code Authorizes:** Generative AI models reason over intent, compare specifications, and propose cart actions. Deterministic code enforces budgets, quantity ceilings, cryptographic signatures, and payment execution.
2. **Real Razorpay Integration:** Full end-to-end Test Mode transaction lifecycle (Server Orders API $\rightarrow$ Razorpay Standard Checkout $\rightarrow$ HMAC-SHA256 Signature Verification $\rightarrow$ Idempotent State Machine).
3. **Dual-Sided Value:** An effortless, zero-friction buyer experience paired with an enterprise-grade Merchant Control Center featuring real-time revenue analytics, agent traces, and an AI Revenue Advisor.

---

## 2. Frozen Scope & Priority Categorization

To guarantee a world-class demonstration for the Razorpay Buildathon, features are strictly classified into three tiers.

### Tier A: MUST BUILD (Buildathon Core MVP)
These components form the demonstrable vertical slice and must be fully operational:
* **AI Buyer Experience:**
  * Conversational intent parsing (budget, hard specifications, category, use-case).
  * Structured catalog search and specification comparison across 50–100 synthetic SKUs.
  * Contextual recommendations with explainable justifications (*"Why Kharridlo recommends this"*).
  * Smart Cart calculation with bounded accessory upselling (e.g., +₹1,499 mouse for laptop setups).
  * Interactive Purchase Authorization Modal (The Policy Gate) with tiered confirmation.
  * Real Razorpay Test Mode checkout launch, simulated payment, and server verification.
  * Order success confirmation with downloadable receipt breakdown.
  * Step-by-step explainable audit trail showing microsecond-level decision history.
* **Safety & Failure Scenarios (The Video Moments):**
  * **Intentional Over-Budget Block:** Buyer attempts ₹1,49,000 purchase against ₹70,000 cap; policy halts transaction; Razorpay API is never invoked; under-budget alternatives are suggested.
  * **Payment Decline Handling:** Graceful recovery from simulated card decline with non-blind retries.
  * **Inventory Fallback:** Out-of-stock item triggers instant spec-matched replacement suggestions.
  * **Prompt-Injection Defense:** Catalog descriptions sandboxed as untrusted data.
* **Merchant Intelligence:**
  * Core KPIs: AI GMV, AI-assisted orders, conversational conversion rate (15.6% vs 3.2% baseline), AOV uplift (+23.8%), upsell acceptance, blocked unsafe volume.
  * Live Agent Activity Trace showing tool calls, inputs, and outputs.
  * Policy Center showing spending ceilings and authorization tiers.

### Tier B: SHOULD BUILD (High-Impact Enhancements)
* **AI Revenue Advisor:** Interactive merchant-facing query interface (*"How do I increase AI conversion this week?"*) with one-click recommendation application.
* **AI Buyer API:** Standardized JSON-LD endpoints (`/ai/catalog`, `/ai/search`, `/ai/cart`, `/ai/order`) demonstrating agent-to-agent headless commerce.
* **Mobile-Responsive Viewports:** Adaptive layouts for the conversational buyer flow and a focused mobile merchant companion.
* **Synthetic Evaluation Runner:** Automated test runner executing 50+ benchmark scenarios reporting accuracy, policy compliance, and latency.

### Tier C: NICE TO HAVE (Future Roadmap)
* Multi-modal voice shopping interface.
* Cross-merchant federated shopping protocols (UCP/ACP protocol bridges).
* Dynamic algorithmic price elasticity testing.

---

## 3. End-to-End System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                  │
│   Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui         │
│                                                                         │
│   ┌───────────────────────────────┐   ┌───────────────────────────────┐ │
│   │      AI BUYER WORKSPACE       │   │    MERCHANT CONTROL CENTER    │ │
│   │ • Conversational Chat + Tray  │   │ • Revenue & Conversion KPIs   │ │
│   │ • Product Cards & Compare     │   │ • Live Agent Activity Stream  │ │
│   │ • Smart Cart & Budget Meter   │   │ • Policy Governance Center    │ │
│   │ • Policy Gate Authorization   │   │ • Order Ledger & Audit Log    │ │
│   │ • Razorpay Checkout Overlay   │   │ • AI Revenue Advisor          │ │
│   └──────────────┬────────────────┘   └───────────────┬───────────────┘ │
└──────────────────┼────────────────────────────────────┼─────────────────┘
                   │ HTTPS / JSON REST API              │
                   ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND SERVICE                            │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ API GATEWAY LAYER                                               │   │
│   │ • Pydantic v2 Request/Response Validation                        │   │
│   │ • Firebase Auth Session Verification & RBAC                     │   │
│   │ • Rate Limiting & Idempotency Header Guards                     │   │
│   └────────────────┬────────────────────────────────┬───────────────┘   │
│                    │                                │                   │
│   ┌────────────────▼────────────────┐   ┌───────────▼───────────────┐   │
│   │      COMMERCE AGENT LAYER       │   │ DETERMINISTIC POLICY GATE │   │
│   │ • Google Gemini API             │   │ • Single Transaction Cap  │   │
│   │ • Google ADK Framework          │   │ • Cumulative Daily Cap    │   │
│   │ • Controlled Tool Invocation    │   │ • Quantity Ceilings       │   │
│   │ • Strict System Instructions    │   │ • Inventory Validation    │   │
│   │ • Untrusted Data Sandboxing     │   │ • Tiered Confirmation     │   │
│   └────────────────┬────────────────┘   └───────────┬───────────────┘   │
│                    │ Proposes Actions               │ Authorizes        │
│                    └────────────────┬───────────────┘                   │
│                                     ▼                                   │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ CORE APPLICATION SERVICES                                       │   │
│   │ • Catalog Service (Search, Filter, Spec Compare)                │   │
│   │ • Cart Service (Deterministic Subtotals & Discounts)            │   │
│   │ • Order & Payment State Machine (CREATED->PENDING->PAID)        │   │
│   │ • Razorpay Service (Orders API & HMAC Verification)             │   │
│   │ • Audit & Event Engine (Append-Only Microsecond Ledger)         │   │
│   └─────────────────────────────────┬───────────────────────────────┘   │
└─────────────────────────────────────┼───────────────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
┌───────────────────────────┐ ┌───────────────┐ ┌─────────────────────────┐
│   POSTGRESQL DATABASE     │ │ REDIS CACHE   │ │  RAZORPAY TEST MODE     │
│ • Products & Inventory    │ │ • Sessions    │ │ • Orders API            │
│ • Orders & Order Items    │ │ • Rate Limits │ │ • Standard Checkout SDK │
│ • Policies & Governance   │ │ • Ephemeral   │ │ • Webhook Ingestion     │
│ • Immutable Audit Logs    │ │   Cart State  │ │ • HMAC-SHA256 Signatures│
└───────────────────────────┘ └───────────────┘ └─────────────────────────┘
```

---

## 4. Key Architectural Boundaries & Invariants

1. **The LLM Never Touches Credentials:** The Gemini agent is completely isolated from Razorpay API keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`). Only the deterministic `PaymentService` in FastAPI interacts with Razorpay.
2. **The LLM Never Sets Final Prices:** Prices and cart totals are computed strictly server-side from PostgreSQL SKU records. The LLM cannot mutate unit prices or discount rates.
3. **Hard Policy Ceiling:** Any transaction exceeding the configured buyer/merchant spending limit (default ₹70,000) is halted at the policy layer. The backend returns a structured `403 POLICY_BLOCKED` response, completely bypassing the payment service.
4. **Idempotent Checkout Execution:** Every checkout initiation requires an `Idempotency-Key` header (`uuidv4`). Duplicate requests within a 15-minute window return the existing order state to prevent double charges.
5. **Untrusted Data Isolation:** Catalog descriptions, customer reviews, and external query parameters are treated as untrusted strings. When injected into prompt templates, they are enclosed within `<untrusted_catalog_data>` tags to neutralize prompt-injection vectors.

---

## 5. Master Technical Document Map

The complete implementation plan is broken down into modular, single-responsibility technical design documents located in `docs/`:

| Document | Purpose | Key Content |
| :--- | :--- | :--- |
| **`screen-implementation-matrix.md`** | UI/UX & Component Mapping | Detailed spec for all 24 screens/states, component hierarchies, routes, APIs, and P1/P2/P3 priorities. |
| **`technical-architecture.md`** | Deep System Architecture | Detailed service interactions, network topologies, security trust zones, and Cloud Run deployment model. |
| **`ai-agent-architecture.md`** | Agent Engine & ADK Design | Tool schemas (`search_products`, `calculate_cart`, etc.), tool permissions, system prompts, and injection defenses. |
| **`data-model.md`** | Relational Database Schema | 15 PostgreSQL tables, SQLAlchemy ORM models, foreign keys, indexes, and state machine enums. |
| **`api-contract.md`** | REST & AI API Specifications | OpenAPI specifications, endpoints, request/response schemas, HTTP status codes, and error models. |
| **`policy-engine.md`** | Deterministic Safety Gate | Exact rule definitions, authorization tiers (Auto vs Confirmation vs Block), evaluation algorithm, and audit triggers. |
| **`razorpay-integration-plan.md`** | Payment Flow Architecture | Order creation, client-side checkout modal launch, HMAC-SHA256 signature verification, and webhook handling. |
| **`audit-observability.md`** | Event Logging & Tracing | Immutable audit schema, event types, OpenTelemetry trace spans, live merchant feed, and privacy boundaries. |
| **`failure-handling-matrix.md`** | Resilience & Error Handling | Complete failure matrix covering out-of-stock, policy blocks, payment rejections, timeouts, and recovery procedures. |
| **`testing-strategy.md`** | Quality Assurance Plan | Pytest unit test suites, FastAPI integration tests, Playwright E2E scenarios, and security validation suites. |
| **`evaluation-framework.md`** | Benchmark & Metrics | 50-scenario evaluation dataset, accuracy measurement, policy compliance rate, latency, and cost tracking. |
| **`implementation-roadmap.md`** | Phased Execution Milestones | 10 chronological development milestones, acceptance criteria, vertical slice order, and risk mitigation. |

---

## 6. Implementation Principles & Antigravity Workflow

* **Vertical Slice First:** We will not build 20 empty frontend pages before the backend works. We build a working catalog $\rightarrow$ cart $\rightarrow$ policy gate $\rightarrow$ Razorpay payment slice first.
* **No Premature Monoliths:** Backend logic is modularized into clean Python modules (`app/services/`, `app/agents/`, `app/policy/`). Frontend is built with reusable, accessible shadcn/ui components.
* **Deterministic Verification:** Every milestone must be validated via automated tests and manual verification before proceeding to the next.
