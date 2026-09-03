# Kharridlo — Phased Implementation Roadmap & Build Milestones

This document establishes the step-by-step engineering roadmap for building **Kharridlo** (*"From AI intent to trusted transactions."*).

---

## 1. Complete 15-Milestone Roadmap

| Milestone | Title | Status |
| :--- | :--- | :--- |
| **Milestone 1** | Project Foundation, Local Development Environment & Health Checks | ✅ Complete |
| **Milestone 2** | Synthetic Product Catalog, PostgreSQL Foundation, Alembic Migrations & Real-Time Inventory | ✅ Complete |
| **Milestone 3** | Cart Engine & Session State Management (Integer Paise Arithmetic & Inventory Reservations) | ✅ Complete |
| **Milestone 4** | Deterministic Commerce Policy Engine (Tiered Spending Limits & Buyer Authorization Gate) | ✅ Complete |
| **Milestone 5** | Gemini + Google ADK Agent & Bounded Tool Integration (7 Bounded Tools & Prompt Injection Isolation) | ✅ Complete |
| **Milestone 6** | Razorpay Test Mode Payment Pipeline & Real Payment Verification | ✅ Complete |
| **Milestone 7** | Immutable Audit Trail & Failure Handling Polish | ✅ Complete |
| **Milestone 8** | AI Buyer Experience (Stitch UI Implementation) | ⏳ In Progress / Up Next |
| **Milestone 9** | Real Marketplace Data Integration (Amazon Creators API + Flipkart Feed) | 📋 Planned |
| **Milestone 10** | Real Product Images & Media Quality | 📋 Planned |
| **Milestone 11** | Gemini & Groq Orchestration & Deterministic Fallback | 📋 Planned |
| **Milestone 12** | Merchant Intelligence Dashboard & Activity Feed | 📋 Planned |
| **Milestone 13** | 500-Scenario Evaluation Suite & Buildathon Polish | 📋 Planned |
| **Milestone 14** | Final End-to-End Verification | 📋 Planned |
| **Milestone 15** | Production Deployment | 📋 Planned |

---

## 2. Milestone Descriptions

### Milestone 1: Foundation & Local Environment
* **Scope:** Configure local PostgreSQL 16 database, FastAPI backend architecture, Next.js 14 frontend, dependencies, and environment configuration.
* **Status:** Complete & verified.

### Milestone 2: Synthetic Catalog & Inventory Engine
* **Scope:** 84-SKU verified tech catalog (laptops, accessories, audio, peripherals) with deterministic integer paise pricing and real-time inventory tracking.
* **Status:** Complete & verified.

### Milestone 3: Cart Engine & Session State Management
* **Scope:** Authoritative server-side cart with integer paise arithmetic, temporary inventory reservations, and cross-session isolation.
* **Status:** Complete & verified.

### Milestone 4: Deterministic Policy Engine
* **Scope:** Strict spending limits (Standard ₹70,000 ceiling, Elevated ₹1,50,000 threshold with explicit buyer confirmation), automated block on budget overflow.
* **Status:** Complete & verified.

### Milestone 5: Gemini Agent & Bounded Commerce Tools
* **Scope:** Google Gemini ADK agent restricted to 7 bounded discovery/cart tools. Server-side context injection and prompt injection isolation.
* **Status:** Complete & verified.

### Milestone 6: Razorpay Test Mode Payment Pipeline
* **Scope:** Server-side order creation, standard checkout popup integration, HMAC-SHA256 signature verification, and test payment capture.
* **Status:** Complete & verified.

### Milestone 7: Immutable Audit Trail & Failure Handling Polish
* **Scope:** Two-tier defense-in-depth immutability (PostgreSQL trigger + SQLAlchemy ORM listeners), recursive secret/card redaction, canonical event taxonomy, and structured failure/recovery codes.
* **Status:** Complete & verified.

### Milestone 8: AI Buyer Experience (Stitch UI Implementation)
* **Scope:** Complete Stitch UI implementation with DhanKriya rebrand to Kharridlo, rich interactive chat, modern cart experience, and streamlined Razorpay checkout.
* **Status:** Ready for implementation.

### Milestone 9: Real Marketplace Data Integration
* **Scope:** Amazon Creators API and Flipkart feed integration, real marketplace pricing, exact descriptions, customer ratings, and EMI options.
* **Status:** Planned.

### Milestone 10: Real Product Images & Media Quality
* **Scope:** High-resolution product images, verified CDN links, gallery previews, and crisp visual presentation for all products.
* **Status:** Planned.

### Milestone 11: Gemini & Groq Orchestration & Deterministic Fallback
* **Scope:** Multi-model routing between Google Gemini 2.5 Flash and Groq (Llama 3), latency optimization, and seamless deterministic fallback.
* **Status:** Planned.

### Milestone 12: Merchant Intelligence Dashboard & Activity Feed
* **Scope:** Real-time agent activity feed, AI revenue analytics, conversion uplift metrics, drop-off analysis, and merchandising recommendations.
* **Status:** Planned.

### Milestone 13: 500-Scenario Evaluation Suite & Buildathon Polish
* **Scope:** Comprehensive 500-scenario test suite evaluating agent safety, tool bounds, policy compliance, injection defense, and edge cases.
* **Status:** Planned.

### Milestone 14: Final End-to-End Verification
* **Scope:** Full automated and manual verification pass across all user flows, checkout scenarios, edge cases, and performance criteria.
* **Status:** Planned.

### Milestone 15: Production Deployment
* **Scope:** Containerized cloud deployment, production environment configuration, SSL, health monitoring, and final buildathon submission artifacts.
* **Status:** Planned.
