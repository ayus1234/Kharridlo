# DhanKriya — Screen Implementation & Component Matrix

This document maps all approved screens from the Stitch designs (`stitch_dhankriya_ai_buyer_experience/`) to their respective React/Next.js component structures, routes, API dependencies, state machines, and implementation priorities.

---

## 1. Priority Categorization Legend
* **P1 (Core MVP — Mandatory):** Must be fully functional with live API integration for the Buildathon 5-minute video demo.
* **P2 (High-Impact Enhancement):** Rich polish features that elevate the demo credibility.
* **P3 (Secondary Polish):** Advanced views implemented if time allows, with graceful fallbacks.

---

## 2. Buyer Experience Screen Matrix (Screens 1 – 13)

| # | Screen Name & Stitch Folder | Route | Priority | Main Components | Required APIs | AI / Tool Role | Failure State |
| :- | :--- | :--- | :-: | :--- | :--- | :--- | :--- |
| **1** | **AI Commerce Landing**<br>`dhankriya_ai_shopping_home` | `/` | **P1** | `HeroSection`, `IntentPromptBar`, `QuickStartChips`, `TrustBadgeBar`, `HeaderNav` | `GET /api/products/featured`<br>`GET /api/policies/current` | Pre-seeds popular intent queries; initializes session | Network drop $\rightarrow$ offline banner |
| **2** | **AI Shopping Workspace**<br>`ai_shopping_assistant_1` & `_2` | `/shop` | **P1** | `ChatStream`, `UserMessageBubble`, `AgentMessageCard`, `ActiveContextTray`, `BudgetMeter` | `POST /api/agent/chat`<br>`GET /api/cart` | Parses intent; extracts budget, specs; executes search | Ambiguous intent $\rightarrow$ prompts clarification |
| **3** | **Product Results & Grid**<br>`recommended_products` | `/shop/results` | **P1** | `ProductGrid`, `ProductCard`, `FitExplainerBadge`, `CompareCheckbox`, `AddToCartButton` | `POST /api/products/search`<br>`POST /api/cart/items` | `search_products()`, `get_recommendations()` | No matches $\rightarrow$ relaxes constraints with prompt |
| **4** | **Product Comparison Matrix**<br>`compare_products` | `/shop/compare` | **P1** | `ComparisonTable`, `SpecHighlightRow`, `TradeoffBadge`, `AgentRecommendationPill` | `POST /api/products/compare` | `compare_products()`: ranks candidates by workload match | Missing spec field $\rightarrow$ shows "N/A" pill |
| **5** | **Product Details View**<br>`laptop_pro_15_details` | `/products/[id]` | **P1** | `ProductGallery`, `SpecSheet`, `SuitabilityAnalysisBox`, `BundleUpsellCard`, `BuyNowCTA` | `GET /api/products/[id]`<br>`POST /api/cart/items` | `get_product_details()`, `suggest_bundle()` | Out of stock $\rightarrow$ shows replacement cards |
| **6** | **Smart Cart & Bounded Upsell**<br>`purchase_authorization` (Cart view) | `/cart` | **P1** | `CartItemList`, `CartItemRow`, `BundleSuggestionBanner`, `BudgetProgressMeter`, `OrderSummaryCard` | `GET /api/cart`<br>`PATCH /api/cart/items/[id]`<br>`DELETE /api/cart/items/[id]` | `calculate_cart_total()`, `suggest_bundle()` | Cart exceeds limit $\rightarrow$ amber alert on meter |
| **7** | **Purchase Authorization (The Policy Gate)**<br>`purchase_authorization` | `/checkout/authorize` | **P1** | `PolicyGateModal`, `ItemizedReviewTable`, `PolicyChecklist`, `ConfirmationTierBadge`, `AuthorizeButton` | `POST /api/policies/evaluate`<br>`POST /api/orders/create` | `check_policy()`: verifies budget, quantity, inventory | Limit exceeded $\rightarrow$ redirects to Screen 11 |
| **8** | **Razorpay Checkout Transition**<br>`secure_checkout_transition` | `/checkout/pay` | **P1** | `GatewayTransitionCard`, `OrderSummaryPill`, `RazorpaySDKContainer`, `TestModeAlert` | `POST /api/payments/create-order`<br>`POST /api/payments/verify` | `request_payment()`: hands off order to Razorpay SDK | Razorpay modal fails $\rightarrow$ retry button |
| **9** | **Order Success & Receipt**<br>`order_confirmed` | `/orders/[id]/success` | **P1** | `SuccessAnimation`, `ReceiptContainer`, `OrderMetaPills`, `AuditTrailCTA`, `DownloadReceiptBtn` | `GET /api/orders/[id]` | `get_order_status()`: transitions state to `PAID` | Receipt fetch error $\rightarrow$ fallback confirmation |
| **10** | **Transaction Audit Trail**<br>`transaction_audit_trail` | `/orders/[id]/audit` | **P1** | `AuditTimelineView`, `AuditNode`, `ActorBadge`, `TimestampTag`, `RawMetadataModal` | `GET /api/audit/orders/[id]` | Visualizes every tool call, policy check, and auth step | Missing log $\rightarrow$ shows "reconciling" pill |
| **11** | **Blocked Transaction Screen**<br>`transaction_blocked_1` & `_2` | `/checkout/blocked` | **P1** | `SafetyLockIcon`, `PolicyViolationCard`, `VarianceMeter`, `AlternativeProductCards` | `POST /api/policies/evaluate`<br>`GET /api/products/alternatives` | Highlights policy limit; surfaces under-₹70k items | Policy service error $\rightarrow$ safe fail-closed block |
| **12** | **Out-of-Stock Recovery**<br>`product_unavailable` | `/shop/unavailable` | **P2** | `InventoryAlertBanner`, `SpecMatchedAlternatives`, `OneClickReplaceCTA` | `GET /api/products/alternatives` | `check_inventory()`: detects 0 stock, finds substitutes | No substitutes $\rightarrow$ suggests adjusting budget |
| **13** | **Payment Failure State**<br>`payment_failed` | `/checkout/failed` | **P1** | `DeclineAlertBanner`, `ReasonCodeExplainer`, `RetryTestPaymentBtn`, `ReturnToCartBtn` | `POST /api/payments/retry` | Explains decline reason; prevents automated looping | Secondary failure $\rightarrow$ offers customer support modal |

---

## 3. Merchant Experience Screen Matrix (Screens 14 – 20)

| # | Screen Name & Stitch Folder | Route | Priority | Main Components | Required APIs | AI / Tool Role | Failure State |
| :- | :--- | :--- | :-: | :--- | :--- | :--- | :--- |
| **14** | **Merchant Dashboard Overview**<br>`merchant_dashboard_overview` | `/merchant` | **P1** | `MetricCardGrid` (GMV, Orders, Conversion), `RevenueChart`, `RecentTransactionsTable`, `QuickAlerts` | `GET /api/analytics/overview`<br>`GET /api/orders/recent` | Aggregates conversational revenue vs traditional baseline | Backend timeout $\rightarrow$ cached metrics fallback |
| **15** | **AI Commerce Analytics**<br>`ai_commerce_analytics` | `/merchant/analytics` | **P2** | `ConversionFunnelChart`, `AOVComparisonCard`, `UpsellPerformanceTable`, `IntentTagCloud` | `GET /api/analytics/funnel`<br>`GET /api/analytics/upsells` | Telemetry on bundle acceptance and conversion uplift | Empty dataset $\rightarrow$ seed data toggle |
| **16** | **Merchant Orders & Audit Ledger**<br>`orders_audit_logs` | `/merchant/orders` | **P1** | `OrderFilterBar`, `OrderDataTable`, `StatusPill` (`PAID`, `BLOCKED`), `AuditInspectorDrawer` | `GET /api/orders`<br>`GET /api/audit/events` | Filter by `BLOCKED_POLICY`, `PAID_AI`, `FAILED_PAYMENT` | Query error $\rightarrow$ retry button |
| **17** | **Live Agent Activity Trace**<br>`agent_activity_trace` | `/merchant/activity` | **P1** | `LiveEventStream`, `ToolCallAccordion`, `LatencyBadge`, `PayloadInspector`, `SessionFilter` | `GET /api/audit/agent-trace`<br>`WS /api/agent/stream` | Shows real-time tool calls without chain-of-thought | Stream disconnected $\rightarrow$ polling fallback |
| **18** | **Policy Governance Center**<br>`policy_center` | `/merchant/policies` | **P1** | `SpendingLimitSlider`, `TieredAuthRuleEditor`, `MerchantWhitelistCard`, `SavePolicyBtn` | `GET /api/policies`<br>`PUT /api/policies` | Read/write deterministic boundaries; LLM cannot mutate | Unauthenticated $\rightarrow$ redirects to login |
| **19** | **Audit Logs Explorer**<br>`orders_audit_logs` | `/merchant/audit` | **P2** | `SearchableLogGrid`, `EventFilter`, `VerificationHashBadge`, `ExportCSVBtn` | `GET /api/audit/logs` | Verifies cryptographic integrity of decision hashes | Database latency $\rightarrow$ paginated loader |
| **20** | **AI Revenue Advisor**<br>`ai_revenue_advisor` | `/merchant/advisor` | **P2** | `InsightPromptBar`, `RecommendationCard`, `ObservedPatternBox`, `OneClickApplyBtn` | `POST /api/agent/advisor`<br>`POST /api/policies/apply` | Analyzes drop-offs; recommends bundles & merchandising | LLM failure $\rightarrow$ rule-based fallback advice |

---

## 4. Security & System States (States 21 – 24)

| # | State Name & Reference | UI Implementation | Priority | Behavior & User Feedback |
| :- | :--- | :--- | :-: | :--- |
| **21** | **Prompt Injection Defense View**<br>`agent_trace_policy_enforcement` | Inline Security Badge in Trace Drawer | **P1** | Shows malicious description text enclosed within `<untrusted_data>` tags, demonstrating zero policy override. |
| **22** | **Empty State**<br>Universal Component | Centered Card with Actionable Link | **P1** | Rendered when search yields 0 items, cart is empty, or audit logs have no matches. Includes reset CTA. |
| **23** | **Loading & Shimmer States**<br>Universal Component | Tailwind CSS Shimmer / Skeleton Loaders | **P1** | Smooth skeleton cards for product grids and chat responses with concise messages (*"Searching 84 products..."*). |
| **24** | **General Error & Recovery**<br>React Error Boundary | Global Toast Notification & Error Card | **P1** | Catches unexpected render crashes and network drops; preserves local cart state in `localStorage`. |

---

## 5. Screen-to-Component Tree Architecture

```text
frontend/src/
├── app/
│   ├── layout.tsx                     # Global Root Layout with Providers & Header
│   ├── page.tsx                       # Screen 1: Landing
│   ├── shop/
│   │   ├── page.tsx                   # Screen 2: AI Shopping Workspace
│   │   ├── results/page.tsx           # Screen 3: Product Results
│   │   ├── compare/page.tsx           # Screen 4: Product Comparison
│   │   └── unavailable/page.tsx       # Screen 12: Out-of-Stock Fallback
│   ├── products/[id]/page.tsx         # Screen 5: Product Details
│   ├── cart/page.tsx                  # Screen 6: Smart Cart
│   ├── checkout/
│   │   ├── authorize/page.tsx         # Screen 7: Purchase Authorization
│   │   ├── pay/page.tsx               # Screen 8: Razorpay Checkout
│   │   ├── blocked/page.tsx           # Screen 11: Blocked Transaction
│   │   └── failed/page.tsx            # Screen 13: Payment Failure
│   ├── orders/[id]/
│   │   ├── success/page.tsx           # Screen 9: Order Success
│   │   └── audit/page.tsx             # Screen 10: Audit Trail
│   └── merchant/
│       ├── layout.tsx                 # Merchant Sidebar & Topbar Shell
│       ├── page.tsx                   # Screen 14: Merchant Overview
│       ├── analytics/page.tsx         # Screen 15: AI Analytics
│       ├── orders/page.tsx            # Screen 16: Orders & Ledger
│       ├── activity/page.tsx          # Screen 17: Agent Activity Trace
│       ├── policies/page.tsx          # Screen 18: Policy Center
│       └── advisor/page.tsx           # Screen 20: AI Revenue Advisor
├── components/
│   ├── ui/                            # shadcn/ui primitives (button, card, dialog, badge, table)
│   ├── buyer/
│   │   ├── chat-stream.tsx            # Conversational message feed
│   │   ├── context-tray.tsx           # Live shopping state & budget meter
│   │   ├── product-card.tsx           # Rich product card with fit explainer
│   │   ├── comparison-matrix.tsx      # Spec comparison table
│   │   └── policy-gate-modal.tsx      # Tiered human confirmation modal
│   └── merchant/
│       ├── kpi-card.tsx               # Reusable metric card with delta indicator
│       ├── revenue-chart.tsx          # Recharts revenue trend line chart
│       ├── agent-trace-feed.tsx       # Real-time event log viewer
│       └── advisor-card.tsx           # Actionable recommendation card
```
