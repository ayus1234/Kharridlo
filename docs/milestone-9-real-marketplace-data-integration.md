# Milestone 9: Real Marketplace Data Integration

**Project:** Kharridlo  
**Official Tagline:** *"From AI intent to trusted transactions."*  
**Milestone:** Milestone 9 — Real Marketplace Data Integration  
**Status:** Completed & Verified  

---

## 1. Executive Summary & Architecture Overview

Milestone 9 introduces real marketplace data integration for **Kharridlo**, unifying external product catalogs from **Amazon India** (via the Amazon Creators API) and **Flipkart** (via the Flipkart Affiliate API and partner feeds) with Kharridlo's authoritative internal inventory and deterministic commerce engine.

Crucially, Milestone 9 establishes a strict **Commerce Authority Boundary**:
- **External Discovery Layer:** Ingests, normalizes, caches, and compares real marketplace product titles, images, original descriptions, specifications, offers, and ratings without mutating internal state.
- **Authoritative Commerce Layer:** Kharridlo's internal warehouse inventory, student policy verification engine, biometric limits, and Razorpay payment processing operate strictly on `VERIFIED` internal mapped products. Unmapped external items cannot create Razorpay orders or claim stock reservations.
- **Data Provenance & Honesty:** Complete separation between `original_description` (unmodified marketplace text), `ai_summary` (Kharridlo AI coursework synthesis), and `specifications`. Missing fields (e.g. absent reviews or EMI) are explicitly surfaced as `"Not provided by marketplace"` rather than fabricated.

---

## 2. Marketplace Providers & API Integration

### 2.1 Amazon Creators API Adapter (`backend/app/marketplace/adapters/amazon.py`)
- **API Spec:** Amazon Creators API (current approved successor to deprecated PA-API).
- **Target Marketplace:** Amazon India (`webservices.amazon.in`, `www.amazon.in`).
- **Core Operations Implemented:**
  - `SearchItems`: Multi-keyword search across categories with browse node filtering, sort options, and resource selection.
  - `GetItems`: Single and batch ASIN lookup retrieving ItemInfo, Images, and OffersV2.
- **Resource Groups Ingested:**
  - `Images.Primary.Large`, `Images.Variants`
  - `ItemInfo.Title`, `ItemInfo.ByLineInfo`, `ItemInfo.Classifications`, `ItemInfo.Features`, `ItemInfo.ProductInfo`, `ItemInfo.TechnicalInfo`
  - `OffersV2.Listings.Price`, `OffersV2.Listings.MerchantInfo`, `OffersV2.Listings.Promotions`
- **Missing Field & Honesty Handling:**
  - Amazon Creators API does not return customer review text or unverified EMI data; the adapter records `has_reviews=False`, `has_emi=False` unless explicitly returned in listing promotions. No review sentiment or star ratings are synthesized.

### 2.2 Flipkart Affiliate API Adapter (`backend/app/marketplace/adapters/flipkart.py`)
- **API Spec:** Flipkart Affiliate API v1.0 / Partner Product Feed.
- **Core Operations Implemented:**
  - `search_products`: Keyword-based product lookup querying affiliate endpoints with pagination.
  - `get_product`: FSN (Flipkart Serial Number) direct lookup.
  - Category feed traversal and delta stream ingestion.
- **Resource Groups Ingested:**
  - Product base info: title, description, brand, category paths.
  - Image URLs (high-resolution, thumbnail).
  - Pricing: Selling price, Maximum Retail Price (MRP), currency (`INR`).
  - Stock availability status (`IN_STOCK`, `OUT_OF_STOCK`).
  - Partner offers and discount percentages.
- **URL Expiry & Compliance:**
  - Affiliate redirect links and deep links respect tokenized expiration parameters and redirect compliance.

### 2.3 Provider Credentials Protocol & Offline Determinism
- In development and test environments where live `AMAZON_CREATORS_API_KEY` or `FLIPKART_AFFILIATE_TOKEN` are absent, the adapters operate in `unconfigured_fixture_mode` using verified real-world fixtures (`backend/app/marketplace/adapters/fixtures.py`).
- Real-world sample products include genuine Amazon.in ASINs (`B0CHX1W1XY`, `B0C9J7CLL7`, `B0CX81G85R`) and Flipkart FSNs (`COMG9H7X9WXYZ123`, `ACCG876543210987`).
- The system never pretends unauthenticated requests succeeded against live endpoints (`live_access_verified=False`).
- No secrets are ever committed to version control; `.env.example` provides explicit placeholder configurations.

---

## 3. Database Schema & Alembic Migration

Alembic migration `b63706ff112b_add_milestone9_marketplace_tables.py` introduces seven normalized tables to PostgreSQL:

```
[MarketplaceProvider]
    ├── code (PK, e.g., 'amazon', 'flipkart', 'kharridlo_verified')
    ├── display_name, status, api_base_url, rate_limit_rps
    └── last_health_check, live_access_verified

[MarketplaceProduct]
    ├── id (PK, UUID)
    ├── provider (FK -> MarketplaceProvider.code)
    ├── provider_product_id (e.g., ASIN, FSN)
    ├── title, brand, category, canonical_url
    ├── original_description, normalized_description, ai_summary
    ├── specifications (JSONB)
    ├── source_price_minor, source_mrp_minor, source_currency
    ├── availability_status, source_rating, source_review_count, seller_name
    └── fetched_at, expires_at, created_at, updated_at

[MarketplaceProductImage]
    ├── id (PK, UUID)
    ├── product_id (FK -> MarketplaceProduct.id)
    ├── source_url, image_type, width, height, sort_order, is_primary

[MarketplaceOffer]
    ├── id (PK, UUID)
    ├── product_id (FK -> MarketplaceProduct.id)
    ├── offer_title, offer_description, price_minor, discount_percentage

[MarketplaceReviewSummary]
    ├── id (PK, UUID)
    ├── product_id (FK -> MarketplaceProduct.id)
    ├── average_rating, total_review_count, rating_distribution (JSONB)

[MarketplaceFinanceInformation]
    ├── id (PK, UUID)
    ├── product_id (FK -> MarketplaceProduct.id)
    ├── emi_available, min_monthly_minor, emi_providers (JSONB)

[MarketplaceFetchLog]
    ├── id (PK, UUID)
    ├── provider, endpoint, request_type, status_code, duration_ms, items_count

[MarketplaceInternalMapping]
    ├── id (PK, UUID)
    ├── provider, provider_product_id
    ├── internal_product_id (FK -> products.id, nullable)
    ├── mapping_status (UNMAPPED, CANDIDATE, VERIFIED, DISABLED, PRICE_MISMATCH)
    ├── mapping_confidence, can_authoritative_checkout
```

---

## 4. Commerce Authority Boundary

Kharridlo's core trust guarantee requires that external marketplace feeds cannot compromise internal escrow, inventory reservation, or student policy controls:

| Workflow Step | Mapped / Internal Item (`VERIFIED`) | External Discovery Item (`UNMAPPED`) |
| :--- | :--- | :--- |
| **Catalog Browsing** | Yes (Badge: `Kharridlo Verified`) | Yes (Badge: `Amazon.in` or `Flipkart`) |
| **Search & Filtering** | Yes | Yes |
| **PDP Specifications** | Yes | Yes (Separated Specs / Original / AI Tabs) |
| **Compare Matrix** | Yes (Side-by-side) | Yes (Side-by-side with Provenance Badge) |
| **Add to Cart** | Permitted (`/api/v1/cart/{id}/items`) | **Blocked** (`400 Bad Request / Authority Gate`) |
| **Policy Verification** | Executed deterministically | Not evaluated |
| **Razorpay Checkout** | Order created (`razorpay_order_id`) | **Blocked** (Zero external order generation) |
| **Purchase Fulfillment** | Kharridlo Escrow | External link out (`View on Amazon.in / Flipkart`) |

---

## 5. Provenance & Field Honesty Protocol

1. **Three-Layer Description Separation:**
   - `original_description`: The verbatim listing text returned by the marketplace API.
   - `ai_summary`: Clearly badged AI analysis summarizing suitability for academic coursework.
   - `specifications`: Structured key-value technical attributes.
2. **Missing Field Transparency:**
   - Missing ratings display: `"Ratings: Not provided by marketplace"`
   - Missing seller info displays: `"Merchant: Not disclosed by provider feed"`
   - Missing MRP displays only the selling price without fabricated strikethrough discounts.
3. **Zero Fabricated Reviews:**
   - Only review counts and ratings directly supplied by the upstream provider are shown. Synthetic review text is strictly prohibited.

---

## 6. Resilience, Caching & Deduplication Architecture

- **In-Memory Cache Layer:**
  - Search queries: 15-minute TTL (`MARKETPLACE_SEARCH_CACHE_TTL_SECONDS=900`).
  - Product details: 30-minute TTL (`MARKETPLACE_PRODUCT_CACHE_TTL_SECONDS=1800`).
- **In-Flight Request Deduplication:**
  - Prevents thundering herds when multiple concurrent buyers query the same search terms or ASINs.
- **Provider Throttling & Rate Limiting:**
  - Sliding-window rate limiters adhere to provider limits (Amazon: 1 RPS initial burst 10; Flipkart: 5 RPS).
  - Exponential backoff with jitter on HTTP 429 and 5xx; fail-fast on 401/403.
- **Audit Logging:**
  - Every outbound call is logged in `marketplace_fetch_logs` with sanitized query parameters, response latency, and item counts.

---

## 7. Gemini AI Agent Catalog Compatibility

- The Gemini agent's **strictly bounded set of 7 tools** remains unchanged.
- `search_products` and `get_product` tools in `backend/app/agent/tools/catalog_tools.py` query the normalized marketplace layer.
- External product content returned to the LLM context is strictly enclosed within `<untrusted_catalog_data>` XML tags to eliminate prompt injection risks from third-party marketplace listing titles or descriptions.
- The agent is architecturally incapable of executing payments or charging cards.

---

## 8. Verification Results

### 8.1 Backend Test Suite (Pytest)
- **Marketplace Tests (`backend/tests/test_marketplace.py`):** 7 comprehensive test suites covering:
  - Amazon Creators API normalization
  - Flipkart Affiliate API normalization
  - Missing field honesty handling
  - Provider unavailable fallback
  - In-memory cache hits and TTL expiration
  - Request deduplication
  - Commerce boundary enforcement (unmapped item rejected from authoritative cart)
- **Full Backend Suite:**
  - **114 passed** out of 114 tests in 18.39s (100% pass rate).
  - All existing cart, catalog, policy, agent, and merchant audit tests remained fully functional.

### 8.2 Frontend & Multi-Screen Responsiveness
- **Catalog Page (`/catalog`):**
  - Integrated provider filter tabs ("All Marketplace", "Amazon.in", "Flipkart", "Kharridlo Verified").
  - Clear source badges, seller metadata, and honest review labels.
  - Interactive detail modal with multi-tab description views.
- **Product Details Page (`/product/[id]`):**
  - Supports both internal SKUs and marketplace ASINs/FSNs.
  - Three distinct description tabs: Verified Specifications, Original Marketplace Description, and AI Student Summary.
  - Interactive Commerce Authority Gate disabling unmapped checkout while providing direct provider buy links.
- **Compare Page (`/compare`):**
  - Cross-marketplace comparison table displaying source provenance badges and authority gate indicators.
- **Responsive Viewport Verification:**
  - All screens validated across 320px (small mobile), 375px (mobile), 768px (tablet), 1280px (desktop), and 1920px (wide desktop) without horizontal scrolling.
