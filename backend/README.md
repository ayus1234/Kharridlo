# Kharridlo — Backend Service

FastAPI-powered backend service for **Kharridlo** (Razorpay AI Buildathon — Track 01).

## Prerequisites

* Python 3.11+
* pip / virtualenv

## Local Setup

1. **Create and activate a virtual environment:**
   ```bash
   python -m venv .venv
   # On Windows PowerShell:
   .venv\Scripts\Activate.ps1
   # On Linux/macOS:
   source .venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment:**
   ```bash
   copy .env.example .env
   ```

4. **Run the server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

## Endpoints

* `GET /` — Service identification
* `GET /health` — Liveness and health check
* `GET /api/v1/status` — API version and environment status
* `GET /docs` — Interactive Swagger UI documentation

## Running Tests

```bash
pytest
```
