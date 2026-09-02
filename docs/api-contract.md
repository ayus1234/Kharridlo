# DhanKriya — API Contract & REST Endpoint Specification

This document provides the formal API contract for the **DhanKriya** FastAPI backend service, specifying endpoints, request/response models, validation rules, and HTTP status codes.

---

## 1. Global Standards & Error Format

All API errors return a standardized JSON envelope:
```json
{
  "error": {
    "code": "POLICY_BLOCKED" | "INVALID_REQUEST" | "PAYMENT_FAILED" | "NOT_FOUND",
    "message": "Human-readable explanation of error",
    "details": {},
    "timestamp": "2026-09-03T01:31:02.104Z"
  }
}
```

---

## 2. Product & Catalog API (`/api/products`)

### `POST /api/products/search`
* **Purpose:** Queries catalog items matching criteria.
* **Request Body:**
  ```json
  {
    "category": "laptop",
    "max_price": 70000.0,
    "min_ram_gb": 16,
    "use_case": "ai_dev",
    "limit": 4
  }
  ```
* **Response `200 OK`:**
  ```json
  {
    "items": [
      {
        "id": "prod_lp15_01",
        "title": "TechNova Laptop Pro 15",
        "category": "laptop",
        "price_inr": 64999.0,
        "specs": { "ram_gb": 16, "storage_gb": 512, "cpu": "Intel Core Ultra 7" },
        "in_stock": true,
        "image_url": "/images/laptop_pro_15.png",
        "ai_match_percentage": 98,
        "recommendation_reason": "Optimal balance of 16GB RAM and Ultra 7 CPU under ₹70,000"
      }
    ],
    "total_found": 3
  }
  ```

---

### `POST /api/products/compare`
* **Purpose:** Returns structured side-by-side comparison matrix for selected product IDs.
* **Request Body:** `{ "product_ids": ["prod_lp15_01", "prod_tb14_02"] }`
* **Response `200 OK`:** Returns comparison specs, performance rankings, and trade-off summaries.

---

## 3. Smart Cart API (`/api/cart`)

### `GET /api/cart`
* **Headers:** `X-Session-ID: sess_881923`
* **Response `200 OK`:** Returns active cart items, subtotal, active spending limit (`70000.0`), and remaining budget (`3502.0`).

### `POST /api/cart/items`
* **Request Body:** `{ "product_id": "prod_lp15_01", "quantity": 1, "is_bundle_upsell": false }`
* **Response `200 OK`:** Updated cart object with validated quantities.
* **Response `400 Bad Request`:** Emitted if `quantity > max_quantity_per_sku`.

---

## 4. Policy Engine API (`/api/policies`)

### `POST /api/policies/evaluate`
* **Purpose:** Evaluates cart against deterministic spending rules prior to payment initiation.
* **Request Body:** `{ "cart_id": "cart_881249", "buyer_id": "usr_9912" }`
* **Response `200 OK` (Passed / Requires Confirmation):**
  ```json
  {
    "decision": "PASSED" | "CONFIRMATION_REQUIRED",
    "spending_limit_inr": 70000.0,
    "cart_total_inr": 66498.0,
    "remaining_buffer_inr": 3502.0,
    "requires_user_confirmation": true,
    "confirmation_tier": "TIER_3_HIGH_VALUE",
    "authorization_token": "auth_tok_signed_991248"
  }
  ```
* **Response `403 Forbidden` (Policy Blocked):**
  ```json
  {
    "error": {
      "code": "POLICY_BLOCKED",
      "message": "Transaction amount of ₹1,49,000 exceeds maximum spending cap of ₹70,000",
      "details": {
        "requested_amount_inr": 149000.0,
        "spending_limit_inr": 70000.0,
        "excess_inr": 79000.0,
        "suggested_alternative_ids": ["prod_lp15_01", "prod_tb14_02"]
      }
    }
  }
  ```

---

## 5. Payment API (`/api/payments`) [Razorpay Test Mode]

### `POST /api/payments/create-order`
* **Headers:** `Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d`
* **Request Body:**
  ```json
  {
    "cart_id": "cart_881249",
    "authorization_token": "auth_tok_signed_991248"
  }
  ```
* **Response `200 OK`:**
  ```json
  {
    "order_id": "dk_ord_10042",
    "razorpay_order_id": "order_test_981249",
    "amount_paise": 6649800,
    "currency": "INR",
    "key_id": "rzp_test_public_key",
    "merchant_name": "TechNova Store by DhanKriya"
  }
  ```

### `POST /api/payments/verify`
* **Request Body:**
  ```json
  {
    "order_id": "dk_ord_10042",
    "razorpay_order_id": "order_test_981249",
    "razorpay_payment_id": "pay_test_881923",
    "razorpay_signature": "cryptographic_hmac_hash"
  }
  ```
* **Response `200 OK`:**
  ```json
  {
    "status": "SUCCESS",
    "order_id": "dk_ord_10042",
    "payment_id": "pay_test_881923",
    "verified_at": "2026-09-03T01:31:24.000Z",
    "receipt_url": "/orders/dk_ord_10042/receipt"
  }
  ```
* **Response `400 Bad Request`:** Returned if HMAC-SHA256 signature verification fails.

---

## 6. AI Agent Conversational API (`/api/agent`)

### `POST /api/agent/chat`
* **Request Body:**
  ```json
  {
    "session_id": "sess_881923",
    "message": "I need a laptop for AI development under ₹70,000"
  }
  ```
* **Response `200 OK`:**
  ```json
  {
    "response_text": "I found 3 laptops that match your AI development needs under ₹70,000. Here are the top candidates:",
    "recommended_products": ["prod_lp15_01", "prod_tb14_02"],
    "bundle_suggestion": {
      "product_id": "prod_mouse_01",
      "title": "Precision Wireless Mouse",
      "price_inr": 1499.0,
      "reason": "Frequently paired with development laptops; keeps total within ₹70k budget"
    },
    "tool_calls_executed": ["search_products", "suggest_bundle"]
  }
  ```

---

## 7. AI Buyer API (`/ai/*`) — Machine-Readable Commerce

* `GET /ai/catalog`: Returns catalog formatted as JSON-LD schema with specifications and stock availability.
* `POST /ai/search`: Semantic search accepting structured intent JSON.
* `POST /ai/cart`: Creates an ephemeral cart session.
* `POST /ai/order`: Pre-validates bounds and generates a pre-authenticated Razorpay test payment token.
* `GET /ai/order/{id}`: Returns machine-readable order status and cryptographic verification proof.
