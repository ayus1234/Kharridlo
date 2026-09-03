# Kharridlo — Technical Architecture & System Design

This document details the core technical architecture of **Kharridlo**, defining component responsibilities, network topologies, trust zones, security boundaries, and the Google Cloud Run deployment model.

---

## 1. System Architecture Overview

Kharridlo is built as a high-performance modular monolith composed of two primary containerized services:
1. **Frontend Client (Next.js 14 App Router + TypeScript):** Handles server-side rendering, conversational UI streaming, client-side state management, and the Razorpay Checkout overlay.
2. **Backend API & Agent Runtime (FastAPI + Python 3.11):** Hosts the REST endpoints, Google ADK Gemini agent engine, deterministic policy engine, Razorpay service, and append-only audit persistence.

```text
┌───────────────────────────────────────────────────────────────────────────────┐
│                              PUBLIC CLOUD / CDN                               │
│                                                                               │
│   [ Client Browser ]                                                          │
│          │                                                                    │
│          ▼                                                                    │
│   ┌───────────────────────────────────────────────────────────────────────┐   │
│   │ Google Cloud Run: Frontend Container (Next.js 14)                     │   │
│   │ • Route Handlers & Server Components                                  │   │
│   │ • Razorpay Standard Checkout SDK Wrapper                              │   │
│   │ • Zustand Client State (Cart, Session Context, User Preferences)      │   │
│   └───────────────────────────────────┬───────────────────────────────────┘   │
└───────────────────────────────────────┼───────────────────────────────────────┘
                                        │ HTTPS / JSON API (Internal VPC)
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│              SECURE APPLICATION BACKEND (Google Cloud Run)                    │
│                                                                               │
│   FastAPI Service Layer (Python 3.11 + Pydantic v2 + SQLAlchemy 2.0)          │
│                                                                               │
│   ┌───────────────────────────────────────────────────────────────────────┐   │
│   │ API GATEWAY & SECURITY INTERCEPTORS                                   │   │
│   │ • Firebase Auth JWT Verification                                      │   │
│   │ • Rate Limiting & Idempotency Key Enforcer                            │   │
│   │ • Request Sanitizer & Schema Validator                                │   │
│   └───────────────────────────────────┬───────────────────────────────────┘   │
│                                       │                                       │
│          ┌────────────────────────────┴────────────────────────────┐          │
│          ▼                                                         ▼          │
│   ┌──────────────────────────────┐          ┌─────────────────────────────┐   │
│   │ COMMERCE AGENT ENGINE        │          │ DETERMINISTIC POLICY GATE   │   │
│   │ (Google ADK + Gemini API)    │          │ (Hard Python Rules)         │   │
│   │ • Intent Parsing             │          │ • Max Single Cap (₹70,000)  │   │
│   │ • Semantic Catalog Search    │          │ • Daily Rolling Spend Limit │   │
│   │ • Tradeoff Comparison        │          │ • SKU Quantity Ceiling      │   │
│   │ • Contextual Upsell Engine   │          │ • Stock Availability Check  │   │
│   │ • Untrusted Data Sandbox     │          │ • Tiered Confirmation Gate  │   │
│   └──────────────┬───────────────┘          └──────────────┬──────────────┘   │
│                  │ Proposes Tool Actions                   │ Authorizes Action│
│                  └────────────────────┬────────────────────┘                  │
│                                       ▼                                       │
│   ┌───────────────────────────────────────────────────────────────────────┐   │
│   │ APPLICATION DOMAIN SERVICES                                           │   │
│   │ • CatalogService: Product queries, spec filters, inventory lookup     │   │
│   │ • CartService: Subtotals, discount application, item mutations        │   │
│   │ • OrderService: Order state machine (CREATED -> PENDING -> PAID)      │   │
│   │ • PaymentService: Razorpay Orders API call & HMAC-SHA256 verification │   │
│   │ • AuditService: Append-only ledger recording every agent & policy step│   │
│   │ • AnalyticsService: Conversion, AOV uplift, and drop-off aggregations │   │
│   └───────────────────┬───────────────────────────────┬───────────────────┘   │
└───────────────────────┼───────────────────────────────┼───────────────────────┘
                        │                               │
        ┌───────────────┴───────────────┐               ▼
        ▼                               ▼       ┌───────────────────────────┐
┌───────────────────────────┐   ┌───────────────┤ THIRD-PARTY PAYMENT RAILS │
│ Cloud SQL: PostgreSQL 16  │   │ Cloud Memory- │ │                         │
│ • Products, SKUs, Stock   │   │ store (Redis) │ │ Razorpay Test Mode APIs │
│ • Orders, Items, Payments │   │ • Sessions    │ │ • POST /v1/orders       │
│ • Policies & Whitelists   │   │ • Rate Limits │ │ • Checkout Modal SDK    │
│ • Immutable Audit Logs    │   │ • Cart Cache  │ │ • Webhook Verification  │
└───────────────────────────┘   └───────────────┘ └─────────────────────────┘
```

---

## 2. Security Trust Zones & Boundaries

The architecture enforces strict network and execution boundaries:

```text
[TRUST ZONE 0: Untrusted Public]
  └── End-user browser, client input strings, public search queries, test card details.

[TRUST ZONE 1: Presentation Tier]
  └── Next.js frontend on Cloud Run. Has access only to public API endpoints and the public `RAZORPAY_KEY_ID`. Has ZERO access to database credentials, LLM keys, or `RAZORPAY_KEY_SECRET`.

[TRUST ZONE 2: Application & AI Reasoning Tier]
  └── FastAPI backend. The Gemini agent operates in an isolated context. Catalog descriptions and external text inputs are treated as **untrusted data**. The LLM proposes actions via structured tool calls.

[TRUST ZONE 3: Deterministic Financial & Policy Authority]
  └── The Policy Engine and Payment Service. This layer alone holds the authority to check boundaries, create Razorpay orders, verify cryptographic signatures, and mutate payment records. The LLM has zero execution privileges in this zone.

[TRUST ZONE 4: Persistence & External Gateway]
  └── Cloud SQL (PostgreSQL), Redis, and Razorpay API. Communicates strictly via TLS and private VPC peering.
```

---

## 3. Data Flow Topologies

### Flow A: Buyer Intent to Recommendation
1. Client submits: `POST /api/agent/chat` with message: *"I need a laptop for coding under ₹70,000"*.
2. FastAPI passes prompt to Google ADK Agent.
3. Model triggers structured tool: `search_products(category="laptop", max_price=70000, ram=16)`.
4. `CatalogService` executes SQL query against PostgreSQL `products` table.
5. Model synthesizes candidate comparison and formats response with explicit fit reasons.
6. Backend returns JSON payload containing conversational message and structured product cards.

### Flow B: Policy-Gated Razorpay Test Checkout
1. Client clicks `[Authorize & Pay]` on cart totaling ₹66,498.
2. Client submits: `POST /api/payments/create-order` with `Idempotency-Key` and cart ID.
3. `PolicyEngine` executes deterministic checks:
   * Is ₹66,498 $\le$ ₹70,000 (spending limit)? $\rightarrow$ **YES**
   * Are all items in stock? $\rightarrow$ **YES**
   * Is quantity $\le$ 2? $\rightarrow$ **YES**
   * Does it require Tier 3 confirmation? $\rightarrow$ **CONFIRMED BY USER**
4. `PaymentService` invokes Razorpay Test Mode Orders API:
   ```python
   order = razorpay_client.order.create({
       "amount": 6649800,  # in paise
       "currency": "INR",
       "receipt": f"rcpt_{order_id}",
       "payment_capture": 1
   })
   ```
5. Client receives Razorpay Order ID and launches Standard Checkout modal.
6. Upon payment simulation, client receives `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`.
7. Client posts tokens to `POST /api/payments/verify`.
8. Backend verifies signature:
   $$\text{HMAC-SHA256}(\text{order\_id} + "|" + \text{payment\_id}, \text{KEY\_SECRET}) \equiv \text{signature}$$
9. Order state transitions to `PAID`. Audit log persisted.

---

## 4. Google Cloud Run Deployment Architecture

```text
Google Cloud Project: kharridlo-platform
├── Cloud Run Services:
│   ├── kharridlo-frontend (Next.js Node.js 20 container)
│   │   ├── Scaling: 0 to 10 instances
│   │   ├── Memory: 512 MiB, CPU: 1 vCPU
│   │   └── Environment: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_RAZORPAY_KEY_ID
│   └── kharridlo-backend (FastAPI Python 3.11 container via Uvicorn)
│       ├── Scaling: 0 to 10 instances
│       ├── Memory: 1 GiB, CPU: 1 vCPU
│       └── VPC Connector: Access to Cloud SQL & Redis
├── Cloud SQL: PostgreSQL 16 (db-f1-micro for dev / test)
├── Cloud Memorystore: Redis 7.0 (Basic Tier 1 GB)
├── Secret Manager:
│   ├── GEMINI_API_KEY
│   ├── RAZORPAY_KEY_ID
│   ├── RAZORPAY_KEY_SECRET
│   └── DATABASE_URL
└── Cloud Logging & Monitoring: Centralized trace & log ingestion
```
