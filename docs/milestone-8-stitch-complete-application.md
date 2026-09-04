# Milestone 8: Complete Stitch AI Buyer & Merchant Experience Implementation

## 1. Executive Summary

Milestone 8 brings the complete visual and functional design package from `stitch_kharridlo_ai_buyer_experience` to life across **37 unique screens** spanning both the **Buyer Experience** and **Merchant Intelligence & Operations** domains. 

The entire user-facing interface, metadata, headers, titles, empty states, and storage contracts have been cleanly rebranded from **DhanKriya** to **Kharridlo** (*"From AI intent to trusted transactions."*). In strict observance of our core commerce tenet:

> **"AI proposes. Deterministic systems verify and authorize."**

All authoritative numbers (pricing in integer paise, inventory reservations, transaction limits, order proofs, and audit logs) continue to be derived directly from the deterministic backend engines and PostgreSQL. Where merchant telemetry represents synthetic stream data, it is strictly typed and visibly badged with `[Simulated Real-Time Stream]`.

---

## 2. Complete 37-Screen Inventory Table

| # | Screen Name | Source Path in Stitch Reference | Application Route | Target Form Factor | Data Source / Backing Engine |
|---|-------------|---------------------------------|-------------------|--------------------|------------------------------|
| 1 | AI Shopping Home (Desktop) | `dhankriya_ai_shopping_home/screen.png` | `/` | Desktop | Live FastAPI Catalog API (`/api/v1/products`) |
| 2 | AI Shopping Home (Mobile) | `dhankriya_ai_home/screen.png` | `/` | Mobile (Responsive) | Live FastAPI Catalog API |
| 3 | AI Assistant (Split-Pane Desk) | `ai_shopping_assistant_1/screen.png` | `/assistant` | Desktop | Gemini 2.0 Bounded Tools + Live Backend |
| 4 | AI Assistant Reasoning Telemetry | `ai_shopping_assistant_2/screen.png` | `/assistant` | Desktop/Mobile | Live Agent Stream + Telemetry Adapter |
| 5 | Curated Recommendations (Grid) | `recommended_products/screen.png` | `/recommendations` | Desktop | Live Catalog API + Student Policy Filtering |
| 6 | Curated Recommendations (Mobile) | `recommendations/screen.png` | `/recommendations` | Mobile (Responsive) | Live Catalog API |
| 7 | Product Details Page (Desktop) | `laptop_pro_15_details/screen.png` | `/product/[id]` | Desktop | Live Product API (`/api/v1/products/{id}`) |
| 8 | Product Comparison Matrix | `compare_products/screen.png` | `/compare` | Desktop/Mobile | Live Catalog Comparison Engine |
| 9 | Purchase Authorization Gate | `purchase_authorization/screen.png` | `/checkout/authorize` | Desktop | Deterministic Policy Engine (`/policy/evaluate`) |
| 10 | Authorize Purchase (Modal/Action) | `authorize_purchase/screen.png` | `/checkout/authorize` | Desktop/Mobile | Deterministic Buyer Auth Token |
| 11 | Secure Checkout Transition | `secure_checkout_transition/screen.png` | `/checkout/redirect` | Desktop/Mobile | Client Redirect State Machine |
| 12 | Authoritative Cart & Payment Gate | *Existing Milestone 6/7* | `/cart` | Desktop/Mobile | Live Cart Engine & Razorpay SDK |
| 13 | Synthetic Product Catalog | *Existing Milestone 2* | `/catalog` | Desktop/Mobile | Live Catalog API |
| 14 | Order Confirmed & Authorized | `order_confirmed/screen.png` | `/order/confirmed` | Desktop | Live Order API & HMAC Settlement |
| 15 | System Verification Proof Drawer | `successful_order_system_verification/screen.png` | `/order/confirmed` | Desktop/Mobile | Cryptographic Proof Chain (`/payments/verify`) |
| 16 | Payment Interrupted / Cancelled | `payment_failed/screen.png` | `/order/failed` | Desktop/Mobile | Razorpay Error Handler / Clean State |
| 17 | Stockout & AI Recovery State | `product_unavailable/screen.png` | `/product/unavailable` | Desktop/Mobile | Live Inventory Fallback Engine |
| 18 | Policy Hard Block (Rule Intercept) | `transaction_blocked_1/screen.png` | `/transaction/blocked` | Desktop | Policy Engine Decision (`BLOCK`) |
| 19 | Policy Hard Block (Resolution) | `transaction_blocked_2/screen.png` | `/transaction/blocked` | Desktop/Mobile | University Proof Verification Flow |
| 20 | Merchant Dashboard Overview | `merchant_dashboard_overview/screen.png` | `/merchant` | Desktop | Live Audit Log API + Telemetry Adapter |
| 21 | Merchant Pulse | `merchant_pulse/screen.png` | `/merchant` | Desktop/Mobile | Live Metric Pipeline |
| 22 | AI Commerce Command Center | `ai_commerce_command_center/screen.png` | `/merchant/command-center` | Desktop | Radar Metrics, Killswitch, Fleet Stream |
| 23 | Autonomous Agent Efficiency | `ai_commerce_overview/screen.png` | `/merchant/overview` | Desktop | 7 Bounded Tools Execution Matrix |
| 24 | Commerce Analytics & Clusters | `ai_commerce_analytics/screen.png` | `/merchant/analytics` | Desktop | AOV Distribution, NLP Query Clusters |
| 25 | Live Activity Feed | `live_ai_commerce_activity_feed/screen.png` | `/merchant/activity` | Desktop | Live Stream + Interactive Event Simulator |
| 26 | Activity Trace (Telemetry Stream) | `activity_trace/screen.png` | `/merchant/activity` | Desktop/Mobile | Synthetic Event Pipeline |
| 27 | Active Buyer Sessions | `active_ai_buyer_sessions/screen.png` | `/merchant/sessions` | Desktop | Active Sessions Table & Risk Scores |
| 28 | Agent Activity Trace Explorer | `agent_activity_trace/screen.png` | `/merchant/sessions/trace` | Desktop | Step-by-Step Reasoner & Tool Logs |
| 29 | Policy Enforcement Trace | `agent_trace_policy_enforcement/screen.png` | `/merchant/sessions/policy-trace` | Desktop | Rule Boundary Evaluator |
| 30 | Transaction Lifecycle Engine | `live_transaction_lifecycle/screen.png` | `/merchant/lifecycle` | Desktop | 4-Phase State Machine Visualizer |
| 31 | Governance Policy Center | `policy_center/screen.png` | `/merchant/policies` | Desktop | Tier 1/2/3 Threshold Rules |
| 32 | Policy Protection Detail | `policy_protection_detail/screen.png` | `/merchant/policies/[id]` | Desktop | Forensic Rule Inspector |
| 33 | Policy Interception Alert | `policy_protection_alert/screen.png` | `/merchant/policies/alerts` | Desktop | Emergency Interception Ledger |
| 34 | Policy Investigation Console | `merchant_policy_investigation/screen.png` | `/merchant/investigation` | Desktop | SQL/Regex Query Console & Policy Sandbox |
| 35 | Dual-Panel Orders & Audit Ledger | `orders_audit_logs/screen.png` | `/merchant/orders` | Desktop | Live Audit Trail API (`/payments/audit`) |
| 36 | Technical Audit Inspector | `transaction_audit_trail/screen.png` | `/merchant/audit-trail/[id]` | Desktop | Cryptographic HMAC Proof & Trigger Proof |
| 37 | AI Revenue Advisor & Recovery | `ai_revenue_advisor/screen.png` & `ai_inventory_recovery_log/screen.png` | `/merchant/revenue-advisor`, `/merchant/recovery`, `/merchant/system-map` | Desktop | Growth Opportunities, GMV Salvage & System Topology |

---

## 3. Design System & Token Architecture

### 3.1 Color Palette & Typography
- **Midnight Navy**: Primary brand background `#0F172A`, cards `#131B2E`, borders `#1E293B`.
- **Growth Emerald**: Success & authorization green `#10B981`, dark `#006C4A`, glow `rgba(16, 185, 129, 0.15)`.
- **AI Violet**: Reasoning & intelligence `#7C3AED`, deep `#25005A`, glow `rgba(124, 58, 237, 0.2)`.
- **Display Typography**: `Hanken Grotesk` (Google Fonts) for headlines, brand titles, and KPI values.
- **Body & UI**: `Inter` for crisp readability.
- **Telemetry & Financial Data**: `Geist Mono` / monospace for integer paise, transaction hashes, and session IDs.

### 3.2 Reusable Shared Components
1. **`BuyerNavbar`**: Top bar with brand logo (`Kharridlo`), search bar with intent parser, category pills, live cart item counter, student avatar, and responsive mobile drawer.
2. **`BuyerFooter`**: Brand manifesto, student trust markers, policy center links, Razorpay Test Mode badge.
3. **`MerchantSidebar`**: 280px fixed Midnight Navy navigation sidebar with 11 categorized routes, live active route indicator, and storefront toggle.
4. **`MerchantHeader`**: Breadcrumb path, page title/subtitle, data integrity badge (`[Live Audit Data]` or `[Simulated Real-Time Stream]`), and refresh probe button.
5. **`BentoCard`**: Modern bento layout card with optional AI gradient border, status badge, and ambient glow.
6. **`KpiMetricCard`**: Standardized metric card displaying Hanken Grotesk primary value, trend delta pill, and monospace telemetry metadata.
7. **`StatusPip`**: Unified status indicator badge for transactions, inventory, and agent actions.
8. **`ProductImage`**: Resilient image container with broken-image fallback, skeleton loading, and accessible alt labels.

---

## 4. Rebrand Audit

| Legacy Element | Rebranded Kharridlo Implementation |
|---|---|
| Brand Name | **Kharridlo** |
| Tagline | *"From AI intent to trusted transactions."* |
| Browser Session Key | `kharridlo_session_id` (with backward-compatible fallback to `dhankriya_session_id`) |
| Package Name | `kharridlo-frontend` |
| Titles & Headings | All pages, cards, and modals reference **Kharridlo** |
| Reference Assets | Source Stitch mockups retained in `stitch_kharridlo_ai_buyer_experience/` as immutable design references |

---

## 5. Automated Verification Results

### 5.1 Next.js Production Build (`npm run build`)
- **Status**: **PASS (Code 0)**
- **Routes Compiled**: **31/31 routes** (static prerendered & dynamic server-rendered)
- **TypeScript / JSX Errors**: **0**

### 5.2 Backend Test Suite (`pytest`)
- **Status**: **PASS (Code 0)**
- **Tests Executed**: **105 passed in 18.81s**
- **Suites**: `test_agent.py`, `test_audit_trail.py`, `test_cart.py`, `test_catalog.py`, `test_correlation_ratelimit.py`, `test_health.py`, `test_payments.py`, `test_policy.py`, `test_session_security.py`.

### 5.3 Playwright End-to-End Suite (`npx playwright test`)
- **Status**: **PASS (Code 0)**
- **Tests Executed**: **12 passed in 21.7s**
- **Test Matrix**:
  1. `checkout.spec.ts:1`: Catalog product discovery and category filtering
  2. `checkout.spec.ts:2`: Add product to cart and verify authoritative total
  3. `checkout.spec.ts:3`: Deterministic Policy Gate and Buyer Authorization workflow
  4. `checkout.spec.ts:4`: Server-side payment order initiation and Checkout trigger
  5. `checkout.spec.ts:5`: Merchant Audit Dashboard visibility and real-time records
  6. `checkout.spec.ts:6`: Session isolation between independent browser contexts
  7. `stitch-experience.spec.ts:1`: Buyer Experience: Home, Assistant, Recommendations, and Product Detail
  8. `stitch-experience.spec.ts:2`: Buyer Experience: Governance Edge States & Confirmation
  9. `stitch-experience.spec.ts:3`: Merchant Experience: Command Center, Analytics & Live Activity
  10. `stitch-experience.spec.ts:4`: Merchant Experience: Sessions, State Machine, Policies & System Map
  11. `stitch-experience.spec.ts:5`: Mobile Viewport Navigation & Responsiveness
  12. `stitch-experience.spec.ts:6`: Complete Rebrand Verification (Zero DhanKriya in visible UI)

---

## 6. Scope Boundary Confirmation

In strict compliance with roadmap rules:
- **Milestones 9–15 have NOT been started**:
  - No Amazon Creators API or Flipkart Feed integrated yet (Milestone 9).
  - No real product image generation or scraping added yet (Milestone 10).
  - No Groq orchestration engine added yet (Milestone 11).
  - No 500-scenario evaluation suite run yet (Milestone 12).
  - No permanent cloud deployment triggered yet (Milestone 15).
