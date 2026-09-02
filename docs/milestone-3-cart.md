# DhanKriya — Milestone 3: Cart Engine & Session State Management

## 1. Milestone Objective

Milestone 3 establishes the deterministic cart and session state management engine of **DhanKriya** for the **Razorpay AI Buildathon (Track 01: AI Growth & Agentic Commerce)**.

The cart service serves as the authoritative boundary between the product catalog and the upcoming policy engine, payment pipeline, and AI agents:

```
[Catalog Engine] (M2)
        │
        ▼
  [Cart Engine]  <--- MILESTONE 3 (You are here)
        │
        ▼
 [Policy Engine] (M4 - Future)
        │
        ▼
[Razorpay Pipeline] (M6 - Future)
```

### Core Project Principle Enforced
> **"AI proposes. Deterministic systems verify and authorize."**

The future AI agent will never directly alter database rows or independently compute monetary totals. Instead, the AI agent will propose additions (e.g., *"Add DK-LP-15 with quantity 1"*), and the Cart Service will deterministically validate inventory, reserve stock, calculate totals in integer paise, and return the authoritative cart state.

---

## 2. Cart Architecture & Lifecycle

```
                           ┌────────────────────────┐
                           │   Buyer / AI Action    │
                           │   (Proposes Mutation)  │
                           └───────────┬────────────┘
                                       │
                                       ▼
                     ┌───────────────────────────────────┐
                     │     Deterministic Cart Service    │
                     │  - Validate Product & Status      │
                     │  - Row-Level Inventory Lock       │
                     │  - Reserve / Release Stock        │
                     │  - Take Price Snapshot in Paise   │
                     │  - Recalculate Subtotal & Total   │
                     │  - Manage 30-min TTL Expiration   │
                     └─────────────────┬─────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────┐                             ┌───────────────────────┐
│     carts (Table)     │                             │  cart_items (Table)   │
│  - session_id (Index) │1                           *│  - cart_id (FK)       │
│  - subtotal_paise     ├─────────────────────────────┤  - product_id (FK)    │
│  - total_paise        │                             │  - unit_price_paise   │
│  - expires_at         │                             │  - line_total_paise   │
│  - status (active)    │                             │  - UQ(cart_id, prod)  │
└───────────────────────┘                             └───────────────────────┘
```

---

## 3. Relational Schema & Migration

Database migration `f24bcabf7d86_create_carts_and_cart_items_tables.py` introduces two new tables:

### Table: `carts`
* `id` (`VARCHAR(36)`, PK): UUID.
* `session_id` (`VARCHAR(64)`, UNIQUE, NOT NULL, INDEX): Opaque client session identifier.
* `status` (`VARCHAR(32)`, DEFAULT `'active'`, NOT NULL, INDEX): `active`, `expired`, `cleared`, `converted`.
* `currency` (`VARCHAR(3)`, DEFAULT `'INR'`, NOT NULL).
* `subtotal_paise` (`BIGINT`, DEFAULT `0`, NOT NULL): Sum of all item line totals in integer paise.
* `total_paise` (`BIGINT`, DEFAULT `0`, NOT NULL): Authoritative cart total in integer paise.
* `expires_at` (`TIMESTAMPTZ`, NOT NULL, INDEX): Session expiration timestamp (default: `NOW() + 30 minutes`).
* `created_at` (`TIMESTAMPTZ`, DEFAULT `NOW()`).
* `updated_at` (`TIMESTAMPTZ`, DEFAULT `NOW()`, ON UPDATE `NOW()`).

### Table: `cart_items`
* `id` (`VARCHAR(36)`, PK): UUID.
* `cart_id` (`VARCHAR(36)`, FK $\rightarrow$ `carts.id` ON DELETE CASCADE, NOT NULL, INDEX).
* `product_id` (`VARCHAR(36)`, FK $\rightarrow$ `products.id` ON DELETE CASCADE, NOT NULL, INDEX).
* `quantity` (`INTEGER`, DEFAULT `1`, NOT NULL): Must be $\ge 1$.
* `unit_price_paise` (`BIGINT`, NOT NULL): Authoritative immutable price snapshot at the moment of addition.
* `line_total_paise` (`BIGINT`, NOT NULL): Computed as `unit_price_paise * quantity`.
* `created_at` (`TIMESTAMPTZ`, DEFAULT `NOW()`).
* `updated_at` (`TIMESTAMPTZ`, DEFAULT `NOW()`, ON UPDATE `NOW()`).
* **Uniqueness Constraint**: `UNIQUE(cart_id, product_id)` ensures idempotent quantity updates without duplicate rows.

---

## 4. Financial Precision & Price Snapshot Rules

1. **Zero Float Drift**: All prices and monetary totals are stored strictly in **integer paise** (₹1 = 100 paise).
2. **Authoritative Backend Calculations**:
   $$\text{line\_total\_paise} = \text{unit\_price\_paise} \times \text{quantity}$$
   $$\text{subtotal\_paise} = \sum \text{line\_total\_paise}$$
   $$\text{total\_paise} = \text{subtotal\_paise}$$
3. **Price Snapshot Rule**: When an item is added, `Product.price_paise` is copied into `CartItem.unit_price_paise`. If the catalog price changes later, the active cart reservation maintains its historical snapshot until expiration or cart clearing.
4. **Client Security Boundary**: API clients and frontend requests provide only `product_id` and `quantity`. The backend looks up the catalog price and determines totals. Client-supplied prices are strictly rejected.

---

## 5. Inventory Reservation Semantics

To prevent inventory overselling and race conditions:

| Operation | Inventory Action | Available Stock Delta | Reserved Stock Delta |
| :--- | :--- | :---: | :---: |
| **Add item (qty $q$)** | Reserve $q$ units | $-q$ | $+q$ |
| **Increase qty (by $\Delta$)** | Reserve additional $\Delta$ units | $-\Delta$ | $+\Delta$ |
| **Decrease qty (by $\Delta$)** | Release $\Delta$ units | $+\Delta$ | $-\Delta$ |
| **Remove item (qty $q$)** | Release all $q$ units | $+q$ | $-q$ |
| **Clear cart** | Release all reservations across all items | $+\sum q$ | $-\sum q$ |
| **Cart expires (30 min TTL)** | Automatically release all reservations | $+\sum q$ | $-\sum q$ |

### Concurrency Safety
The inventory row is queried with `with_for_update()` inside an atomic PostgreSQL transaction. If requested quantity exceeds `available_quantity`, an `INSUFFICIENT_STOCK` exception is raised and the transaction is automatically rolled back.

---

## 6. Cart Lifecycle & Expiration

* **TTL**: 30 minutes from creation or the latest user activity.
* **Lazy Expiration**: Any read or write to an expired cart automatically triggers:
  1. Complete release of all reserved inventory.
  2. Marking cart `status = "expired"`.
  3. Rejection of further mutations with HTTP 410 (`CART_EXPIRED`).
* **Explicit Expiration Endpoint**: `POST /api/v1/cart/{session_id}/expire` triggers immediate release for testing and lifecycle simulation.

---

## 7. REST API Endpoints (`/api/v1/cart`)

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/cart/{session_id}` | Retrieve or initialize cart for session | `200 OK` |
| `POST` | `/api/v1/cart/{session_id}/items` | Add product to cart with reservation | `200 OK`, `400`, `404`, `410`, `422` |
| `PATCH` | `/api/v1/cart/{session_id}/items/{product_id}` | Update quantity (adjust reservation) | `200 OK`, `400`, `404`, `410`, `422` |
| `DELETE` | `/api/v1/cart/{session_id}/items/{product_id}` | Remove item and release reservation | `200 OK`, `404`, `410` |
| `DELETE` | `/api/v1/cart/{session_id}` | Clear cart and release all reservations | `200 OK` |
| `POST` | `/api/v1/cart/{session_id}/validate` | Validate fulfillability against stock | `200 OK` |
| `POST` | `/api/v1/cart/{session_id}/expire` | Force session expiration (testing) | `200 OK`, `404` |

---

## 8. Standardized Machine-Readable Error Codes

| Code | HTTP Status | Meaning |
| :--- | :---: | :--- |
| `OUT_OF_STOCK` | 400 | Product has zero available units in stock. |
| `INSUFFICIENT_STOCK` | 400 | Requested quantity exceeds available units. |
| `PRODUCT_NOT_FOUND` | 404 | Product ID or SKU does not exist in catalog. |
| `PRODUCT_INACTIVE` | 400 | Product is flagged as inactive. |
| `CART_NOT_FOUND` | 404 | Cart session record does not exist. |
| `CART_EXPIRED` | 410 | Cart session TTL expired; reservation was released. |
| `INVALID_QUANTITY` | 422 | Quantity is less than 1 or exceeds batch limit (100). |
| `ITEM_NOT_FOUND_IN_CART`| 404 | Item being updated or removed is not in the cart. |

---

## 9. Verification & Automated Test Results

### Test Suite (`pytest`): 26 / 26 Passing

```text
tests\test_cart.py ..............                                        [ 53%]
tests\test_catalog.py .........                                          [ 88%]
tests\test_health.py ...                                                 [100%]
======================== 26 passed, 1 warning in 1.88s ========================
```

**Cart Test Coverage:**
1. `test_create_and_get_cart` — Clean initialization, zero totals, active status.
2. `test_independent_sessions_isolation` — Multi-session data isolation.
3. `test_add_product_and_price_snapshot` — Price snapshot and line total precision.
4. `test_add_same_product_aggregates_idempotently` — No duplicate rows, correct quantity sum.
5. `test_update_quantity_upward_and_downward` — Delta reservation adjustments.
6. `test_remove_item_releases_reservation` — Inventory restored to baseline on item removal.
7. `test_clear_cart_releases_all_reservations` — Full inventory restoration on cart clear.
8. `test_validation_errors_nonexistent_and_inactive` — 404/400 errors for invalid SKUs.
9. `test_validation_errors_invalid_quantities` — Zero/negative rejection (422).
10. `test_validation_errors_out_of_stock` — `DK-LP-14-OOS` blocked with `OUT_OF_STOCK`.
11. `test_validation_errors_insufficient_stock` — `DK-LP-LOW-01` bounded by stock.
12. `test_cart_expiration_releases_reservations_and_blocks_mutations` — 410 on expired mutation.
13. `test_cart_validation_endpoint` — Empty cart and fulfillable cart checks.
14. `test_exact_paise_arithmetic_bundle_demo` — End-to-end complementary bundle demo flow.

---

## 10. Demo Flow Validation

1. **Add Laptop (`DK-LP-15`)**:
   * Unit price: ₹64,999 (6,499,900 paise).
   * Subtotal: **₹64,999** (6,499,900 paise).
2. **Add Complementary Mouse (`DK-MS-01`)**:
   * Unit price: ₹1,499 (149,900 paise).
   * Subtotal: **₹66,498** (6,649,800 paise).
   * Displayed total: **₹66,498** (cleanly under ₹70,000 developer limit).
3. **Increase Mouse quantity to 2**:
   * Mouse line total: ₹2,998 (299,800 paise).
   * New total: **₹67,997** (6,799,700 paise).
4. **Remove Mouse**:
   * Total returns to **₹64,999** (6,499,900 paise).
   * Mouse reserved stock released back to available inventory.
5. **Clear Cart**:
   * Cart returns to empty (0 paise).
   * All inventory reservations returned to baseline.

---

## 11. Next Milestone: Milestone 4

With the Cart Engine established as the authoritative commerce state, **Milestone 4** will introduce the **Deterministic Policy Engine** (spending limit verification, single transaction caps, and human-in-the-loop authorization gates).
