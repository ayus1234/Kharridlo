# Kharridlo

### From AI intent to trusted transactions.

> **Project Rename Note:** Formerly named *DhanKriya*, officially renamed to **Kharridlo** (*"From AI intent to trusted transactions."*).

Kharridlo is an AI-native commerce platform that enables AI buyers to discover products, receive contextual recommendations, make bounded purchase decisions, and complete Razorpay-powered transactions while helping merchants understand and grow AI-assisted revenue.

## Razorpay AI Buildathon

* **Track:** Track 01 — AI Growth & Agentic Commerce
* **Repository:** [https://github.com/ayus1234/DhanKriya](https://github.com/ayus1234/DhanKriya)

## Progress & Milestones

* [x] **Milestone 1:** Project Foundation, Local Development Environment & Health Checks
* [x] **Milestone 2:** Synthetic Product Catalog, PostgreSQL Foundation, Alembic Migrations & Real-Time Inventory
* [x] **Milestone 3:** Cart Engine & Session State Management (Integer Paise Arithmetic & Inventory Reservations)
* [x] **Milestone 4:** Deterministic Commerce Policy Engine (Tiered Spending Limits & Buyer Authorization Gate)
* [x] **Milestone 5:** Gemini + Google ADK Agent & Bounded Tool Integration (7 Bounded Tools & Prompt Injection Isolation)
* [x] **Milestone 6:** Razorpay Test Mode Payment Pipeline & Merchant Audit Visibility
* [ ] **Milestone 7:** Immutable Audit Trail & Failure Handling Polish
* [ ] **Milestone 8:** AI Buyer Experience (Stitch UI Implementation)
* [ ] **Milestone 9:** Merchant Intelligence Dashboard & Activity Feed
* [ ] **Milestone 10:** 500-Scenario Evaluation Suite & Buildathon Polish

---

## Tech Stack

* **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons
* **Backend:** Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Psycopg 3
* **Database:** PostgreSQL 16 (financial precision in integer paise)
* **Testing:** Pytest, FastAPI TestClient, Next.js Build Typechecker

---

## Project Structure

```text
Kharridlo/
├── docs/                 # Product specifications, blueprints, and milestone reports
│   ├── milestone-1-foundation.md
│   ├── milestone-2-catalog.md
│   └── ...
├── frontend/             # Next.js web application
│   ├── app/
│   │   ├── page.tsx      # System connectivity & environment dashboard
│   │   └── catalog/      # Deterministic synthetic catalog browser
│   └── ...
├── backend/              # FastAPI Python service
│   ├── alembic/          # Database version migrations
│   ├── app/
│   │   ├── api/v1/       # REST API endpoints (/products, /status)
│   │   ├── core/         # Configuration & settings
│   │   ├── db/           # SQLAlchemy base & session factories
│   │   ├── models/       # Relational models (Product, Inventory)
│   │   ├── schemas/      # Pydantic validation schemas
│   │   └── services/     # Business logic layer (CatalogService)
│   ├── scripts/          # Database seeding & catalog generator
│   └── tests/            # Automated test suite (12 passed)
├── data/
│   └── synthetic_catalog.json  # 84-SKU verified catalog
└── tests/                # System-level verification suites
```

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
# Update DATABASE_URL in .env if needed
```

Run database migrations and seed the 84-product catalog:
```bash
alembic upgrade head
python scripts/seed_catalog.py
```

Run backend tests (80 tests covering cart, policy, agent, and Razorpay):
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

## Razorpay Test Mode Architecture

Kharridlo enforces strict separation between AI reasoning and financial authorization:
> **"AI proposes. Deterministic systems verify and authorize."**

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
[Merchant Audit Trail] ─(Real-time audit log with zero secrets leaked)
```

### Security Guarantees:
1. **Zero AI Payment Authority:** Gemini has strictly 0 payment tools and 0 access to Razorpay credentials.
2. **Authoritative Calculation:** Order amounts are determined solely by backend database prices in integer paise.
3. **Pre-Order Revalidation:** Policy spending caps and stock availability are rechecked milliseconds before order creation.
4. **Idempotent Ingestion:** Webhooks and signature verifications are deduplicated using SHA-256 payload hashes and event IDs.
5. **Secret Redaction:** API keys, HMAC secrets, and tokens are strictly excluded from responses, logs, and frontend code.

---

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run build
npm run dev
```
Open `http://localhost:3000` for the dashboard, `http://localhost:3000/catalog` for products, `http://localhost:3000/cart` for policy & checkout, and `http://localhost:3000/merchant` for the real-time merchant audit trail.

---

## License

MIT License — see [LICENSE](LICENSE) for details.
