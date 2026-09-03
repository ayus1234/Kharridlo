# Kharridlo — Frontend Client

Next.js 14 (App Router) client application for **Kharridlo** (Razorpay AI Buildathon — Track 01).

## Prerequisites

* Node.js 18.17+
* npm or yarn

## Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   copy .env.example .env.local
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```text
   http://localhost:3000
   ```

## Connectivity with Backend

The frontend communicates with the Kharridlo FastAPI backend service running at `http://localhost:8000` (configured via `NEXT_PUBLIC_API_BASE_URL`). The landing page actively displays the live health status of the backend API.
