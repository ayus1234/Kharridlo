# DhanKriya — Milestone 1: Foundation & Local Development Architecture

This document records the architectural foundation, environment configurations, connectivity patterns, and boundaries established in **Milestone 1** of **DhanKriya**.

---

## 1. What Was Implemented

1. **FastAPI Backend Application (`backend/`):**
   * Modular architecture: `app/main.py`, `app/core/config.py`, `app/schemas/status.py`, and `app/api/v1/router.py`.
   * Foundation endpoints:
     * `GET /`: Returns `{"service": "DhanKriya API", "status": "running"}`.
     * `GET /health`: Returns `{"status": "healthy", "service": "DhanKriya API"}`.
     * `GET /api/v1/status`: Returns `{"project": "DhanKriya", "version": "0.1.0", "environment": "development"}`.
   * Environment-driven CORS configuration allowing requests from `http://localhost:3000`.
   * Automated unit test suite using `pytest` verifying all endpoints.
2. **Next.js 14 Frontend Application (`frontend/`):**
   * Next.js 14 App Router with TypeScript, Tailwind CSS, and Lucide React icons.
   * Brand identity: Strictly **DhanKriya** (*"From AI intent to trusted transactions."*).
   * Live connectivity status widget displaying real-time connection status with the backend at `http://localhost:8000/health`.
   * Graceful fallback states: Handles offline backend state with explicit error messaging and manual retry.
3. **Environment Isolation & Security:**
   * Safe `.env.example` templates for both frontend and backend.
   * Strict `.gitignore` rules preventing secrets, virtual environments, `.next`, and raw design exports from ever being committed.

---

## 2. Why This Project Structure Was Chosen

* **Modular Monolith for Buildathon Velocity:** A shared repository housing `frontend/` and `backend/` enables rapid iteration while maintaining clear domain boundaries.
* **Type Safety from Day 1:** TypeScript on the client and Pydantic v2 on the server guarantee strict schema alignment when building out future cart, policy, and payment payloads.
* **Separation of Presentation & Business Logic:** The frontend will exclusively consume the REST API, keeping the application ready for Cloud Run containerization and future headless agentic commerce protocols (`/ai/*`).

---

## 3. Frontend-to-Backend Connectivity Strategy

* **Configuration Variable:** `NEXT_PUBLIC_API_BASE_URL` (Defaults to `http://localhost:8000`).
* **Health Polling:** Client component issues non-blocking, non-cached fetch requests (`cache: "no-store"`) to `${NEXT_PUBLIC_API_BASE_URL}/health`.
* **State Mapping:**
  * Status 200 $\rightarrow$ `Backend API: Connected (healthy)` (Emerald badge + response latency).
  * Network Error / Timeout $\rightarrow$ `Backend API: Unavailable (disconnected)` (Rose badge + actionable retry).

---

## 4. Local Development Workflow

### Terminal 1: Backend
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # Windows PowerShell
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API Documentation available at: `http://localhost:8000/docs`

### Terminal 2: Frontend
```bash
cd frontend
npm install
npm run dev
```
Application accessible at: `http://localhost:3000`

---

## 5. What Was Intentionally NOT Implemented Yet

In strict alignment with the Milestone 1 scope boundary:
* **No Database Schema Migrations:** PostgreSQL models and migrations will be implemented in Milestone 2 alongside synthetic catalog seed data.
* **No Gemini Agent / ADK Execution:** AI agent workflows are postponed to Milestone 6 after deterministic cart and policy services are verified.
* **No Razorpay API Credentials or Checkout Calls:** Payment pipelines are strictly scheduled for Milestone 4 & 5.
* **No Full Stitch UI Components:** The full 24-screen catalog and dashboard suite will be integrated iteratively starting in Milestone 5.

---

## 6. Known Limitations

* Backend currently operates without persistent database connectivity (in-memory config only).
* Local development assumes ports `3000` (Next.js) and `8000` (FastAPI) are free.
