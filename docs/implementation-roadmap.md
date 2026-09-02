# DhanKriya — Phased Implementation Roadmap & Build Milestones

This document establishes the step-by-step engineering roadmap for building **DhanKriya**. It defines 10 controlled milestones designed to produce a functional end-to-end vertical slice early, rather than building disjointed frontend and backend layers in isolation.

---

## 1. The Vertical Slice Strategy

```text
[Milestone 1: Foundation]
          │
          ▼
[Milestone 2: Catalog & Cart Core]
          │
          ▼
[Milestone 3: Deterministic Policy Gate]
          │
          ▼
[Milestone 4: Razorpay Test Mode Pipeline]
          │
          ▼
[Milestone 5: FIRST WORKING VERTICAL SLICE]  ◄─── Complete Core Payment Verified!
          │
          ▼
[Milestone 6: Gemini ADK Commerce Agent]
          │
          ▼
[Milestone 7: Merchant Intelligence Dashboard]
          │
          ▼
[Milestone 8: Live Trace & AI Revenue Advisor]
          │
          ▼
[Milestone 9: Failure Scenarios & Demo Mode]
          │
          ▼
[Milestone 10: Evaluation, Testing & Deployment]
```

---

## 2. Milestone Breakdown

### Milestone 1: Foundation & Local Environment
* **Scope:** Configure Docker Compose for local PostgreSQL 16 and Redis 7. Initialize FastAPI backend structure and Next.js 14 frontend template with Tailwind CSS and shadcn/ui.
* **Dependencies:** None.
* **Acceptance Criteria:** `docker compose up` starts DB and Redis; backend health check (`GET /health`) returns `200 OK`; frontend renders home shell.
* **Risk:** Port conflicts or container permission issues on Windows.

---

### Milestone 2: Synthetic Catalog & Deterministic Cart Service
* **Scope:** Seed synthetic catalog with 84 tech SKUs (laptops, phones, monitors, accessories). Implement `CatalogService` and `CartService` in FastAPI with PostgreSQL persistence.
* **Dependencies:** Milestone 1.
* **Acceptance Criteria:** `POST /api/products/search` returns filtered laptops; `POST /api/cart/items` calculates subtotal without floating-point error.

---

### Milestone 3: Deterministic Policy Engine & Safety Gate
* **Scope:** Implement `PolicyEngine` rules (POL-01 to POL-05) in Python. Build spending limit checks, quantity ceilings, and tiered confirmation token generation.
* **Dependencies:** Milestone 2.
* **Acceptance Criteria:** Unit tests confirm ₹64,999 passes and ₹1,49,000 raises `403 POLICY_BLOCKED` with zero external calls.

---

### Milestone 4: Razorpay Test Mode Payment Pipeline
* **Scope:** Implement server-side Razorpay order creation (`POST /api/payments/create-order`) and HMAC-SHA256 signature verification (`POST /api/payments/verify`). Set up order state machine (`CREATED` $\rightarrow$ `PENDING` $\rightarrow$ `PAID`).
* **Dependencies:** Milestone 3.
* **Acceptance Criteria:** Can create a Razorpay test order in paise and successfully verify signature of simulated test payment.

---

### Milestone 5: Core Buyer UI & First Working Vertical Slice
* **Scope:** Implement buyer pages: Product Results, Smart Cart, Policy Gate Modal, and Razorpay Checkout overlay. Connect frontend to backend services.
* **Dependencies:** Milestones 2, 3, 4.
* **Acceptance Criteria:** A user can manually click a product, add to cart, review the policy gate, open Razorpay Standard Checkout, pay via test card, and see the confirmed order screen with payment ID.

---

### Milestone 6: Gemini Agent & Google ADK Integration
* **Scope:** Implement the conversational shopping agent using Google Gemini Flash and ADK. Hook up controlled tools (`search_products`, `compare_products`, `suggest_bundle`, `check_policy`). Integrate XML untrusted data sandboxing.
* **Dependencies:** Milestone 5.
* **Acceptance Criteria:** Buyer can type *"I need a laptop for coding under ₹70,000"* and receive structured product cards and a mouse bundle suggestion.

---

### Milestone 7: Audit Trail & Merchant Dashboard Overview
* **Scope:** Implement append-only `audit_logs` persistence. Build the Merchant Dashboard overview displaying AI GMV, orders, conversion uplift, and recent transaction table.
* **Dependencies:** Milestone 5.
* **Acceptance Criteria:** Completed buyer purchases appear instantly in the merchant orders ledger with full audit event history.

---

### Milestone 8: Live Activity Stream & AI Revenue Advisor
* **Scope:** Build the real-time agent activity feed showing tool execution without chain-of-thought tokens. Build the merchant-facing AI Revenue Advisor answering merchandising queries.
* **Dependencies:** Milestones 6, 7.
* **Acceptance Criteria:** Merchant can watch live tool executions and receive actionable bundle recommendations based on drop-off patterns.

---

### Milestone 9: Failure Flow Hardening & Demo Mode Presets
* **Scope:** Build dedicated UI states for Blocked Over-Budget transactions, Test Card Declines, and Out-of-Stock replacements. Add 5 one-click demo presets for bulletproof video recording.
* **Dependencies:** Milestones 5, 6, 7.
* **Acceptance Criteria:** Clicking *"Demo: Budget Block"* triggers a ₹1.49L purchase attempt and displays the blocked screen with under-₹70k alternatives.

---

### Milestone 10: Evaluation Benchmark, Testing & Cloud Run Deployment
* **Scope:** Execute the 500-scenario evaluation benchmark. Run Pytest unit and Playwright E2E suites. Containerize and deploy services to Google Cloud Run. Finalize submission documentation.
* **Dependencies:** Milestones 1 – 9.
* **Acceptance Criteria:** Clean test suite pass; public HTTPS demo URL live on Cloud Run; evaluation report generated; repository ready for Buildathon judging.
