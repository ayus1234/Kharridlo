# Kharridlo

### From AI intent to trusted transactions.

> **Project Branding:** Formerly named *DhanKriya*, officially rebranded to **Kharridlo** (*"From AI intent to trusted transactions."*).

Kharridlo is an AI-native commerce platform that enables AI buyers to discover products, receive contextual recommendations, make bounded purchase decisions, and complete Razorpay-powered transactions while helping merchants understand and grow AI-assisted revenue.

## Razorpay AI Buildathon

* **Track:** Track 01 — AI Growth & Agentic Commerce
* **Repository:** [https://github.com/ayus1234/Kharridlo](https://github.com/ayus1234/Kharridlo)

## Progress & Milestones

* [x] **Milestone 1:** Project Foundation, Local Development Environment & Health Checks
* [x] **Milestone 2:** Synthetic Product Catalog, PostgreSQL Foundation, Alembic Migrations & Real-Time Inventory
* [x] **Milestone 3:** Cart Engine & Session State Management (Integer Paise Arithmetic & Inventory Reservations)
* [x] **Milestone 4:** Deterministic Commerce Policy Engine (Tiered Spending Limits & Buyer Authorization Gate)
* [x] **Milestone 5:** Gemini + Google ADK Agent & Bounded Tool Integration (7 Bounded Tools & Prompt Injection Isolation)
* [x] **Milestone 6:** Razorpay Test Mode Payment Pipeline & Real Payment Verification
* [x] **Milestone 7:** Immutable Audit Trail & Failure Handling Polish
* [ ] **Milestone 8:** AI Buyer Experience (Stitch UI Implementation)
* [ ] **Milestone 9:** Real Marketplace Data Integration (Amazon Creators API + Flipkart Feed)
* [ ] **Milestone 10:** Real Product Images & Media Quality
* [ ] **Milestone 11:** Gemini & Groq Orchestration & Deterministic Fallback
* [ ] **Milestone 12:** Merchant Intelligence Dashboard & Activity Feed
* [ ] **Milestone 13:** 500-Scenario Evaluation Suite & Buildathon Polish
* [ ] **Milestone 14:** Final End-to-End Verification
* [ ] **Milestone 15:** Production Deployment

---

## Tech Stack

* **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Vanilla CSS / Tailwind, Lucide Icons
* **Backend:** Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Psycopg 3
* **Database:** PostgreSQL 16 (financial precision in integer paise, append-only immutability triggers)
* **Testing:** Pytest (105 passed tests), Playwright E2E (6 passed tests), FastAPI TestClient
* **AI Orchestration:** Google Gemini 2.5 Flash, Bounded Commerce Tools, Strict Context Injection

---

## Project Structure

```text
Kharridlo/
├── docs/                 # Product specifications, blueprints, and milestone reports
│   ├── milestone-1-foundation.md
│   ├── milestone-2-catalog.md
│   ├── milestone-3-cart.md
│   ├── milestone-4-policy-engine.md
│   ├── milestone-5-ai-agent.md
│   ├── milestone-7-audit-and-failure-handling.md
│   └── ...
├── frontend/             # Next.js web application
│   ├── app/
│   │   ├── page.tsx      # System connectivity & environment dashboard
│   │   ├── catalog/      # Synthetic catalog browser
│   │   ├── cart/         # Authoritative cart & Razorpay payment gate
│   │   └── merchant/     # Merchant audit trail & governance dashboard
│   └── e2e/              # Playwright end-to-end test suite (6 tests)
├── backend/              # FastAPI Python service
│   ├── alembic/          # Database schema versions & immutability triggers
│   ├── app/
│   │   ├── agent/        # Bounded Gemini ADK agent & deterministic engine
│   │   ├── api/v1/       # REST API endpoints (/products, /cart, /policy, /checkout, /payments)
│   │   ├── core/         # Settings & environment configuration
│   │   ├── db/           # SQLAlchemy session & database engine
│   │   ├── models/       # Relational models (Product, Cart, Checkout, AuditEvent)
│   │   ├── schemas/      # Pydantic validation schemas & canonical audit taxonomy
│   │   └── services/     # Core domain services (Cart, Policy, Payment, Audit, Webhook)
│   ├── scripts/          # Seeding & smoke testing scripts
│   └── tests/            # Automated test suite (105 tests passed)
├── data/
│   └── synthetic_catalog.json  # 84-SKU verified catalog
└── tests/                # System-level verification suites
```

---

## Core Governing Principle

> **"AI proposes. Deterministic systems verify and authorize."**

- **AI Discovery:** AI agents discover, explain, compare, and recommend products.
- **Deterministic Gate:** Only backend services validate pricing, enforce policy limits, reserve stock, and initiate payment.
- **Explicit Buyer Consent:** Payment cannot occur without cryptographic or recorded buyer authorization.
- **Zero Payment Secrets in AI:** Gemini has 0 payment execution tools and 0 access to Razorpay credentials.

```text
[AI Assistant / Gemini]
      │ (Proposes product / cart modification)
      ▼
[Authoritative Cart] ──(Calculates exact integer paise total)
      │
      ▼
[Policy Engine] ───────(Enforces spending limits: STANDARD ₹70k, ELEVATED ₹1.5L)
      │
      ▼
[Buyer Authorization] ─(Explicit human confirmation recorded on server)
      │
      ▼
[Payment Service] ────(Revalidates policy immediately before creating Razorpay order)
      │
      ▼
[Razorpay Checkout] ──(Standard Checkout popup in Test Mode: 'rzp_test_...')
      │
      ▼
[Signature Verification] (HMAC-SHA256 verified on server; stock permanently consumed)
      │
      ▼
[Immutable Audit Trail] (Append-only PostgreSQL trigger + ORM immutability + recursive sanitization)
```

---

## Milestone 7: Immutable Audit Trail & Failure Handling Architecture

Milestone 7 delivers defense-in-depth immutability, complete observability, and structured failure recovery:

1. **Two-Tier Immutability Defense:**
   - **Application Layer:** SQLAlchemy ORM hooks intercept `before_update` and `before_delete` on `AuditEvent`, raising `AuditImmutabilityError`.
   - **Database Layer:** PostgreSQL trigger `trg_audit_events_immutable` executes `prevent_audit_events_mutation()` on raw SQL `UPDATE` and `DELETE`.

2. **Recursive Secret & Card Sanitization:**
   - Deep nested sanitization cleans keys and values matching `secret`, `key`, `signature`, `password`, `token`, `auth`, `cvv`, `card_number`, and headers to `[REDACTED]`.
   - Enforced on write before persistence and on output query via `GET /api/v1/payments/audit`.

3. **Canonical Event Taxonomy & Causality:**
   - Spans AI, Catalog, Cart, Policy, Checkout, Payment, Webhook, and Inventory domains.
   - Preserves distributed `correlation_id` and parent-child event linkage (`parent_event_id`).
   - Webhook and payment verification retries leverage `idempotency_key` indexes.

4. **Structured Failure Codes & Recovery Actions:**
   - Every failure or cancellation records a machine-readable `failure_code`, a business `reason_code`, and an explicit `recovery_action` (e.g. `RETRY_PAYMENT`, `VIEW_COMPLETED_ORDER`, `DEFENSIVE_FALLBACK`).

Full documentation: [`docs/milestone-7-audit-and-failure-handling.md`](docs/milestone-7-audit-and-failure-handling.md)

---

## Local Development Quickstart

### 1. Prerequisites
* Python 3.11+ (Python 3.13 supported)
* Node.js 18+ and npm
* PostgreSQL 16+ running locally

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Unix/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
```

Configure your environment:
```bash
cp .env.example .env
# Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, and GEMINI_API_KEY
```

Run database migrations (including immutability triggers) and seed the 84-product catalog:
```bash
alembic upgrade head
python scripts/seed_catalog.py
```

Run backend tests (105 automated unit and integration tests):
```bash
pytest
```

Run live Gemini ADK smoke test:
```bash
python scripts/smoke_test_gemini_adk.py
```

Run Razorpay Test Mode payment lifecycle smoke test:
```bash
python scripts/smoke_test_razorpay.py
```

Start the backend development server:
```bash
uvicorn app.main:app --reload --port 8000
```
API Documentation: `http://localhost:8000/docs`

---

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run build
npm run start
```
Open `http://localhost:3000` for the dashboard, `http://localhost:3000/catalog` for products, `http://localhost:3000/cart` for policy & checkout, and `http://localhost:3000/merchant` for the real-time merchant audit trail.

Run Playwright End-to-End Tests:
```bash
npx playwright test
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.
