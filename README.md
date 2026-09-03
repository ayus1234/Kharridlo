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
* [ ] **Milestone 6:** Razorpay Test Mode Payment Pipeline
* [ ] **Milestone 7:** Immutable Audit Trail & Failure Handling
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

Run backend tests:
```bash
pytest
```

Start the backend development server:
```bash
uvicorn app.main:app --reload --port 8000
```
API Documentation: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run build
npm run dev
```
Open `http://localhost:3000` to view the environment dashboard or `http://localhost:3000/catalog` to explore the product catalog.

---

## License

MIT License — see [LICENSE](LICENSE) for details.
