# Kharridlo — Relational Database Schema & Data Models

This document defines the complete PostgreSQL 16 relational data model for **Kharridlo**, implemented via SQLAlchemy 2.0 (Async) and Pydantic v2.

---

## 1. Entity Relationship Overview

```text
┌──────────────┐         ┌──────────────┐
│   merchants  │1       *│   products   │1       1┌──────────────┐
│              ├─────────┤              ├─────────┤  inventory   │
└──────────────┘         └───────┬──────┘         └──────────────┘
                                 │1
                                 │
                                 │*
┌──────────────┐1        *┌──────┴───────┐*       1┌──────────────┐
│    users     ├──────────┤  cart_items  ├─────────┤    carts     │
│              │          └──────────────┘         └──────┬───────┘
└──────┬───────┘                                          │1
       │1                                                 │
       │                                                  │1
       │*                                          ┌──────┴───────┐
┌──────┴───────┐1        *┌──────────────┐*       1│    orders    │
│agent_sessions├──────────┤ agent_actions│         └───┬──────────┘
└──────────────┘          └──────────────┘             │1
                                                       │
                                                       │*
┌──────────────┐*        1┌──────────────┐*       1┌───┴──────────┐
│  audit_logs  ├──────────┤   payments   ├─────────┤ order_items  │
└──────────────┘          └──────────────┘         └──────────────┘
```

---

## 2. Core Relational Entities

### Table 1: `merchants`
Represents the verified store entity (`TechNova Store`).
* `id` (VARCHAR(36), PK): UUID.
* `name` (VARCHAR(128), NOT NULL): e.g., "TechNova Store".
* `slug` (VARCHAR(64), UNIQUE, NOT NULL): e.g., "technova-store".
* `razorpay_account_id` (VARCHAR(64), NULL): Linked Razorpay account for multi-merchant splits (optional for test mode).
* `is_active` (BOOLEAN, DEFAULT TRUE).
* `created_at` (TIMESTAMPTZ, DEFAULT NOW()).

---

### Table 2: `products`
The core catalog SKU table.
* `id` (VARCHAR(36), PK): e.g., `"prod_lp15_01"`.
* `merchant_id` (VARCHAR(36), FK $\rightarrow$ `merchants.id`, NOT NULL).
* `title` (VARCHAR(255), NOT NULL): e.g., "TechNova Laptop Pro 15".
* `category` (VARCHAR(64), NOT NULL): "laptop", "phone", "monitor", "accessories".
* `price_inr` (NUMERIC(10,2), NOT NULL): e.g., `64999.00`.
* `currency` (VARCHAR(3), DEFAULT 'INR').
* `specs` (JSONB, NOT NULL):
  ```json
  {
    "ram_gb": 16,
    "storage_gb": 512,
    "cpu": "Intel Core Ultra 7",
    "battery_hours": 11.5,
    "weight_kg": 1.4,
    "display": "15.6-inch OLED 120Hz"
  }
  ```
* `suitable_use_cases` (TEXT[], NOT NULL): `["ai_dev", "software_eng", "data_science"]`.
* `cross_sell_sku_ids` (TEXT[], DEFAULT '{}'): `["prod_mouse_01", "prod_stand_01"]`.
* `image_url` (VARCHAR(512), NOT NULL).
* `is_active` (BOOLEAN, DEFAULT TRUE).

---

### Table 3: `inventory`
* `product_id` (VARCHAR(36), PK, FK $\rightarrow$ `products.id`).
* `stock_count` (INTEGER, NOT NULL, DEFAULT 0).
* `reserved_count` (INTEGER, NOT NULL, DEFAULT 0).
* `low_stock_threshold` (INTEGER, DEFAULT 5).
* `updated_at` (TIMESTAMPTZ, DEFAULT NOW()).

---

### Table 4: `policies`
Deterministic commerce rules governed in the Policy Center.
* `id` (VARCHAR(36), PK): UUID.
* `scope` (VARCHAR(32), NOT NULL): "GLOBAL", "MERCHANT", "BUYER".
* `entity_id` (VARCHAR(36), NULL): Specific user or merchant ID.
* `max_single_transaction_inr` (NUMERIC(10,2), NOT NULL, DEFAULT 70000.00).
* `max_daily_spend_inr` (NUMERIC(10,2), NOT NULL, DEFAULT 100000.00).
* `max_quantity_per_sku` (INTEGER, NOT NULL, DEFAULT 2).
* `tier2_confirmation_threshold_inr` (NUMERIC(10,2), DEFAULT 10000.00).
* `tier3_high_value_threshold_inr` (NUMERIC(10,2), DEFAULT 50000.00).
* `allowed_categories` (TEXT[], DEFAULT '{"laptop","phone","monitor","accessories"}').
* `updated_at` (TIMESTAMPTZ, DEFAULT NOW()).

---

### Table 5: `carts` & Table 6: `cart_items`
* `carts`:
  * `id` (VARCHAR(36), PK): UUID.
  * `session_id` (VARCHAR(64), INDEX, NOT NULL).
  * `buyer_id` (VARCHAR(36), NULL).
  * `subtotal_inr` (NUMERIC(10,2), DEFAULT 0.00).
  * `discount_inr` (NUMERIC(10,2), DEFAULT 0.00).
  * `total_inr` (NUMERIC(10,2), DEFAULT 0.00).
  * `expires_at` (TIMESTAMPTZ, NOT NULL).
* `cart_items`:
  * `id` (VARCHAR(36), PK): UUID.
  * `cart_id` (VARCHAR(36), FK $\rightarrow$ `carts.id`, NOT NULL).
  * `product_id` (VARCHAR(36), FK $\rightarrow$ `products.id`, NOT NULL).
  * `quantity` (INTEGER, NOT NULL, DEFAULT 1).
  * `unit_price_inr` (NUMERIC(10,2), NOT NULL).
  * `is_bundle_upsell` (BOOLEAN, DEFAULT FALSE).

---

### Table 7: `orders` & Table 8: `order_items`
* `orders`:
  * `id` (VARCHAR(36), PK): e.g., `"dk_ord_10042"`.
  * `buyer_id` (VARCHAR(36), NOT NULL).
  * `merchant_id` (VARCHAR(36), FK $\rightarrow$ `merchants.id`, NOT NULL).
  * `cart_id` (VARCHAR(36), FK $\rightarrow$ `carts.id`, NOT NULL).
  * `subtotal_inr` (NUMERIC(10,2), NOT NULL).
  * `total_inr` (NUMERIC(10,2), NOT NULL).
  * `status` (VARCHAR(32), NOT NULL): `CREATED`, `PENDING_PAYMENT`, `PAID`, `FAILED`, `CANCELLED`.
  * `policy_evaluated_at` (TIMESTAMPTZ, NOT NULL).
  * `policy_decision` (VARCHAR(32), NOT NULL): `PASSED`, `BLOCKED`.
  * `created_at` (TIMESTAMPTZ, DEFAULT NOW()).
* `order_items`:
  * `id` (VARCHAR(36), PK).
  * `order_id` (VARCHAR(36), FK $\rightarrow$ `orders.id`, NOT NULL).
  * `product_id` (VARCHAR(36), FK $\rightarrow$ `products.id`, NOT NULL).
  * `quantity` (INTEGER, NOT NULL).
  * `unit_price_inr` (NUMERIC(10,2), NOT NULL).

---

### Table 9: `payments`
Tracks the exact Razorpay Test Mode transaction record.
* `id` (VARCHAR(36), PK): UUID.
* `order_id` (VARCHAR(36), FK $\rightarrow$ `orders.id`, NOT NULL).
* `razorpay_order_id` (VARCHAR(64), UNIQUE, NOT NULL): e.g., `"order_test_981249"`.
* `razorpay_payment_id` (VARCHAR(64), NULL): e.g., `"pay_test_881923"`.
* `razorpay_signature` (VARCHAR(128), NULL): Cryptographic HMAC-SHA256 signature.
* `amount_inr` (NUMERIC(10,2), NOT NULL).
* `amount_paise` (BIGINT, NOT NULL): Amount multiplied by 100 for Razorpay API.
* `currency` (VARCHAR(3), DEFAULT 'INR').
* `status` (VARCHAR(32), NOT NULL): `INITIATED`, `SUCCESS`, `DECLINED`, `VERIFICATION_FAILED`.
* `error_code` (VARCHAR(64), NULL): e.g., `"BAD_REQUEST_ERROR"`.
* `error_description` (TEXT, NULL).
* `idempotency_key` (VARCHAR(64), UNIQUE, NOT NULL).
* `verified_at` (TIMESTAMPTZ, NULL).

---

### Table 10: `audit_logs` (Append-Only Event Store)
* `id` (BIGSERIAL, PK).
* `event_id` (VARCHAR(36), UNIQUE, NOT NULL): e.g., `"ev_audit_9012"`.
* `timestamp` (TIMESTAMPTZ, DEFAULT NOW(), INDEX).
* `session_id` (VARCHAR(64), INDEX, NOT NULL).
* `actor` (VARCHAR(32), NOT NULL): `BUYER`, `AGENT`, `POLICY_ENGINE`, `PAYMENT_GATEWAY`.
* `action` (VARCHAR(64), NOT NULL): e.g., `INTENT_PARSED`, `TOOL_CALL`, `POLICY_EVALUATED`, `ORDER_CREATED`, `PAYMENT_VERIFIED`, `POLICY_BLOCKED`.
* `decision` (VARCHAR(32), NOT NULL): `ALLOW`, `BLOCK`, `REQUIRE_CONFIRMATION`, `FAIL`.
* `metadata` (JSONB, NOT NULL): Safe structured parameters (amounts, SKUs, tool inputs, latency_ms).
* **Constraint:** Immutable table (NO `UPDATE` or `DELETE` grants in production).

---

## 3. Database State Enums

```python
class OrderStatus(str, Enum):
    CREATED = "CREATED"
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PAID = "PAID"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class PaymentStatus(str, Enum):
    INITIATED = "INITIATED"
    SUCCESS = "SUCCESS"
    DECLINED = "DECLINED"
    VERIFICATION_FAILED = "VERIFICATION_FAILED"

class PolicyDecision(str, Enum):
    PASSED = "PASSED"
    CONFIRMATION_REQUIRED = "CONFIRMATION_REQUIRED"
    BLOCKED = "BLOCKED"
```
