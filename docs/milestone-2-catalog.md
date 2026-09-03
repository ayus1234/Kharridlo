# Kharridlo — Milestone 2: Synthetic Product Catalog & Core Commerce Data Foundation

## 1. Executive Summary

Milestone 2 establishes the deterministic commerce foundation of **Kharridlo** for the **Razorpay AI Buildathon (Track 01: AI Growth & Agentic Commerce)**. 

While AI agents reason and recommend products, transactional accuracy and trust require a strictly deterministic backend. In this milestone, we implemented:
* A PostgreSQL relational database schema with **Alembic migration version control**.
* **Financial precision engineering**: All prices stored strictly in **integer paise** (₹1 = 100 paise) to eliminate IEEE 754 floating-point rounding drift.
* A realistic **84-SKU synthetic product catalog** spanning 8 electronics categories.
* Core product and real-time inventory API endpoints under `/api/v1/products`.
* An idempotent, safe database seeding script (`backend/scripts/seed_catalog.py`).
* A responsive Next.js catalog browser (`frontend/app/catalog`) with debounced search, category filtering, availability badges, and product specification modals.
* 100% test pass rate across 12 unit and integration test suites.

---

## 2. Relational Schema Architecture

```
 +---------------------------------------------------------+
 |                       products                          |
 +---------------------------------------------------------+
 | id            VARCHAR(36) PRIMARY KEY                   |
 | sku           VARCHAR(64) UNIQUE NOT NULL INDEX         |
 | name          VARCHAR(255) NOT NULL INDEX               |
 | description   TEXT NOT NULL                             |
 | category      VARCHAR(64) NOT NULL INDEX                |
 | brand         VARCHAR(64) NOT NULL INDEX                |
 | price_paise   BIGINT NOT NULL INDEX (Integer Paise)     |
 | currency      VARCHAR(3) DEFAULT 'INR'                  |
 | specs         JSONB / JSON DEFAULT '{}'                 |
 | image_url     VARCHAR(512) NULL                         |
 | is_active     BOOLEAN DEFAULT TRUE INDEX                |
 | created_at    TIMESTAMP WITH TIME ZONE                  |
 | updated_at    TIMESTAMP WITH TIME ZONE                  |
 +---------------------------------------------------------+
                              | 1
                              |
                              | 1
 +---------------------------------------------------------+
 |                      inventory                          |
 +---------------------------------------------------------+
 | id                  SERIAL PRIMARY KEY                  |
 | product_id          VARCHAR(36) FK -> products.id INDEX |
 | available_quantity  INTEGER DEFAULT 0 NOT NULL          |
 | reserved_quantity   INTEGER DEFAULT 0 NOT NULL          |
 | low_stock_threshold INTEGER DEFAULT 5 NOT NULL          |
 | updated_at          TIMESTAMP WITH TIME ZONE            |
 +---------------------------------------------------------+
```

### Deterministic Availability Logic
Availability status is computed dynamically without manual state synchronization:
* `available_quantity <= 0` $\rightarrow$ `out_of_stock`
* `0 < available_quantity <= low_stock_threshold` $\rightarrow$ `low_stock`
* `available_quantity > low_stock_threshold` $\rightarrow$ `in_stock`

---

## 3. The 84-SKU Synthetic Catalog Breakdown

The synthetic catalog lives at `data/synthetic_catalog.json` and models realistic Indian electronics products:

| Category | SKUs | Price Range (INR) | Sample Products |
| :--- | :---: | :---: | :--- |
| **Laptops** | 20 | ₹29,999 – ₹1,89,000 | TechNova Laptop Pro 15, TechNova DevBook Air 13 |
| **Smartphones** | 10 | ₹14,999 – ₹79,999 | TechNova Pulse 5G, Nexus Apex One |
| **Monitors** | 10 | ₹7,499 – ₹69,999 | TechNova ViewPro 27 4K, UltraWide 34 Curve |
| **Keyboards** | 8 | ₹899 – ₹8,999 | TechNova CodeCraft Pro, KriyaType Ergo Split |
| **Mice** | 10 | ₹349 – ₹8,499 | TechNova Precision Wireless Mouse |
| **Headphones** | 8 | ₹1,299 – ₹19,999 | TechNova SoundSilence Pro ANC, AirBuds TWS |
| **Tablets** | 6 | ₹12,999 – ₹79,999 | TechNova Pad Pro 11, KriyaNote E-Ink Reader |
| **Accessories**| 12 | ₹399 – ₹6,499 | 10-in-1 USB-C Hub, 100W GaN Fast Charger |
| **TOTAL** | **84** | | **Structured & Validated** |

---

## 4. Key AI Demo Scenarios Supported

The catalog is deliberately crafted to support the core Buildathon Track 01 agentic commerce demonstrations:

| Test Scenario | Target SKU / Product ID | Key Attributes | AI Agent / Policy Engine Behavior |
| :--- | :--- | :--- | :--- |
| **Optimal Recommendation** | `DK-LP-15`<br>(`prod_lp15_01`) | **TechNova Laptop Pro 15**<br>₹64,999 (6,499,900 paise)<br>16GB RAM, Core Ultra 7 | Agent recommends this laptop under the ₹70,000 developer budget constraint. |
| **Complementary Bundle** | `DK-MS-01`<br>(`prod_mouse_01`) | **TechNova Precision Wireless Mouse**<br>₹1,499 (149,900 paise) | Total bundle: ₹64,999 + ₹1,499 = ₹66,498, cleanly fitting the ₹70,000 spending limit. |
| **Budget Policy Block** | `DK-LP-ULTRA`<br>(`prod_lp_ultra_01`) | **TechNova Laptop Ultra 16**<br>₹1,49,000 (14,900,000 paise)<br>32GB RAM, RTX 4080 | Policy engine deterministically **blocks** the purchase (exceeds ₹70,000 cap). |
| **Out-of-Stock Recovery** | `DK-LP-14-OOS`<br>(`prod_lp14_oos`) | **TechNova Laptop 14 Lite**<br>₹59,999 (5,999,900 paise)<br>Available Quantity: `0` | Triggers OOS recovery routine and AI alternative recommendation. |
| **Low-Stock Warning** | `DK-LP-LOW-01`<br>(`prod_lp_low_01`) | **TechNova DevBook Air 13**<br>₹61,999 (6,199,900 paise)<br>Available Quantity: `2` (Threshold: 5) | Triggers urgency notification and inventory reservation lock. |

---

## 5. API Endpoints

All endpoints are registered under `/api/v1/products`:

### 1. `GET /api/v1/products`
List active products with pagination and filters.
* Query Parameters: `category`, `brand`, `min_price_inr`, `max_price_inr`, `in_stock_only`, `limit`, `offset`.
* Returns `ProductListResponse` with `items`, `total`, `limit`, `offset`.

### 2. `GET /api/v1/products/search?q={query}`
Deterministic keyword search across product name, description, brand, category, and SKU.

### 3. `GET /api/v1/products/{product_id}`
Retrieve a single product's specifications and current inventory status. Returns `404 Not Found` if missing.

### 4. `GET /api/v1/products/{product_id}/inventory`
Real-time inventory lookup returning `available_quantity`, `reserved_quantity`, and `status`.

---

## 6. Verification and Test Results

### Backend Automated Test Suite
Run from `backend/`:
```bash
pytest
```

**Results (12/12 passing):**
* `test_list_products_default` — PASSED (84 items, pagination)
* `test_list_products_category_filter` — PASSED (Category isolation)
* `test_list_products_price_filter` — PASSED (Integer paise boundaries)
* `test_financial_precision_paise` — PASSED (Paise storage & float conversion)
* `test_get_product_detail_success` — PASSED (SKU DK-MS-01 specs verified)
* `test_get_product_not_found` — PASSED (404 error contract)
* `test_product_search` — PASSED (Keyword ranking & text matching)
* `test_out_of_stock_scenario` — PASSED (Zero stock status)
* `test_low_stock_scenario` — PASSED (Low stock threshold trigger)
* `test_root_endpoint` — PASSED (Base API greeting)
* `test_health_endpoint` — PASSED (Healthcheck probe)
* `test_v1_status_endpoint` — PASSED (Metadata probe)

### Frontend Build Verification
Run from `frontend/`:
```bash
npm run build
```
* **Type checking**: 0 errors
* **Static page generation**: 5/5 pages (`/`, `/_not-found`, `/catalog`)
* **Bundle size**: Shared First Load JS: 87.3 kB

---

## 7. Operational Commands

### Run Alembic Migrations
```bash
cd backend
alembic upgrade head
```

### Seed Catalog (Idempotent)
```bash
cd backend
python scripts/seed_catalog.py
```
Output:
```text
Connecting to database via engine: postgresql+psycopg://postgres:***@localhost:5432/dhankriya
Database schema verified (products and inventory tables ready).
Catalog seeding complete:
  - Products inserted: 84
  - Products updated:  0
  - Total in database: 84
```
