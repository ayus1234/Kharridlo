# Kharridlo Production Deployment & Hardening Guide

This document outlines the deployment architecture, configuration matrix, and operational runbook for **Kharridlo** (*"From AI intent to trusted transactions."*).

---

## 1. System Architecture

```text
[Internet / Webhooks / Clients]
              │
              ▼
    [Reverse Proxy / SSL / Ingress]
              │
      ┌───────┴───────┐
      ▼               ▼
[Next.js 14 Frontend]  [FastAPI Backend (8000)]
  (SSR & Client UI)      (REST APIs, Policy, Agent, Payments)
                             │
                             ▼
                     [PostgreSQL 16]
                     (Integer Paise, ACID Locks)
```

---

## 2. Environment Variables Matrix

| Variable | Scope | Required | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Backend | **Yes** | PostgreSQL connection string (`postgresql+psycopg://user:pass@host:5432/db`) |
| `RAZORPAY_KEY_ID` | Backend | **Yes** | Public Razorpay Test/Live API Key ID (`rzp_test_...`) |
| `RAZORPAY_KEY_SECRET` | Backend | **Yes** | Secret Razorpay API Key. **Backend-only. Never expose to client.** |
| `RAZORPAY_WEBHOOK_SECRET`| Backend | **Yes** | Secret configured in Razorpay Dashboard for webhook HMAC-SHA256 verification. |
| `GEMINI_API_KEY` | Backend | Optional | Google Gemini API key for autonomous product recommendations. |
| `APP_ENV` | Backend | **Yes** | Set to `production` in production. |
| `DEBUG` | Backend | **Yes** | Set to `False` in production to prevent leaking tracebacks. |
| `CORS_ORIGINS` | Backend | **Yes** | Comma-separated allowed frontend origins (e.g., `https://kharridlo.example.com`). |
| `NEXT_PUBLIC_API_BASE_URL`| Frontend | **Yes** | Public URL of the FastAPI backend (e.g., `https://api.kharridlo.example.com`). |

---

## 3. Production Deployment Commands

### Option A: Docker Compose (Recommended for Self-Hosted / VPS)

1. Clone repository and configure `.env`:
   ```bash
   cp backend/.env.example backend/.env
   # Populate production secrets in backend/.env
   ```

2. Launch production stack:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

3. Run database migrations:
   ```bash
   docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
   ```

4. Seed verified product catalog:
   ```bash
   docker compose -f docker-compose.prod.yml exec backend python scripts/seed_catalog.py
   ```

---

## 4. Public Webhook Configuration

1. In the [Razorpay Dashboard](https://dashboard.razorpay.com/) (Settings $\rightarrow$ Webhooks):
   - **Webhook URL:** `https://<your-public-domain>/api/v1/payments/webhook`
   - **Secret:** Must exactly match `RAZORPAY_WEBHOOK_SECRET` in `backend/.env`.
   - **Active Events:**
     - `payment.captured`
     - `payment.failed`
     - `order.paid`
2. **Local Testing via ngrok:**
   ```bash
   ngrok http 8000
   # Set Webhook URL to: https://<ngrok-id>.ngrok-free.app/api/v1/payments/webhook
   ```

---

## 5. Security Checklist

- [x] **Zero AI Payment Authority:** Gemini agent has strictly no payment creation tools.
- [x] **Authoritative Calculations:** All monetary computations use integer paise from PostgreSQL.
- [x] **Request Correlation:** `X-Request-ID` is stamped on every request, response, and audit log.
- [x] **Rate Limiting:** Sliding-window rate limiting active on `/payments/orders`, `/payments/verify`, `/payments/webhook`.
- [x] **Secret Redaction:** API keys, secrets, and auth tokens are masked with `[REDACTED]` in all logs.
- [x] **Session Isolation:** Cart, checkout, and order queries enforce strict `session_id` ownership checks.
