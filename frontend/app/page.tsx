"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, RefreshCw, Server, Laptop, Database, ArrowRight, ShoppingBag, ShoppingCart } from "lucide-react";
import { getOrCreateSessionId } from "@/lib/session";
import AIAssistantDrawer from "@/components/AIAssistantDrawer";

interface HealthData {
  status: string;
  service: string;
}

export default function Home() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [catalogCount, setCatalogCount] = useState<number | null>(null);
  const [cartCount, setCartCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const checkBackendHealth = async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();
    try {
      const res = await fetch(`${apiBaseUrl}/health`, { cache: "no-store" });
      const elapsed = Math.round(performance.now() - startTime);
      setLatency(elapsed);
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
      }
      const data: HealthData = await res.json();
      setHealth(data);

      // Probe catalog count
      try {
        const catRes = await fetch(`${apiBaseUrl}/api/v1/products?limit=1`, { cache: "no-store" });
        if (catRes.ok) {
          const catData = await catRes.json();
          setCatalogCount(catData.total);
        }
      } catch {
        // Fallback gracefully
      }

      // Probe cart count
      try {
        const sid = getOrCreateSessionId();
        const cartRes = await fetch(`${apiBaseUrl}/api/v1/cart/${sid}`, { cache: "no-store" });
        if (cartRes.ok) {
          const cartData = await cartRes.json();
          setCartCount(cartData.total_items_count || 0);
        }
      } catch {
        // Fallback gracefully
      }
    } catch (err: any) {
      setError(err?.message || "Failed to reach backend API");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 via-indigo-50/30 to-slate-100">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-slate-200/80 p-8">
        {/* Brand Header */}
        <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-slate-100">
          <div className="h-11 w-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-200">
            ख
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kharridlo</h1>
            <p className="text-sm font-medium text-indigo-600">From AI intent to trusted transactions.</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/merchant"
              className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
            >
              Merchant Audit
            </Link>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Milestone 6 Active
            </span>
          </div>
        </div>

        {/* Milestone 6 Callout: Razorpay Test Mode & Merchant Audit */}
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 rounded-xl p-5 mb-6 border border-indigo-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">
                Deterministic Security Boundary & Payments
              </span>
              <p className="text-sm text-slate-800 font-semibold mt-0.5">
                Razorpay Test Mode Integration & Immutable Merchant Audit
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Zero AI payment authority • Pre-order policy revalidation • HMAC-SHA256 signature verification • Real-time merchant audit
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 transition-colors shadow-sm"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Catalog ({catalogCount ?? 84})
              </Link>
              <Link
                href="/cart"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Cart ({cartCount})
                <ArrowRight className="w-3 h-3" />
              </Link>
              <Link
                href="/merchant"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-800 bg-indigo-100 hover:bg-indigo-200 transition-colors shadow-sm"
              >
                Audit Log
              </Link>
            </div>
          </div>
        </div>

        {/* System Connectivity Grid */}
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          System Connectivity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Frontend Status */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mt-0.5">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900 text-sm">Frontend</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Online
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Next.js 14 App Router + Tailwind CSS</p>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">Port: 3000</p>
            </div>
          </div>

          {/* Backend Status */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mt-0.5">
              <Server className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900 text-sm">Backend API</span>
                {loading ? (
                  <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking...
                  </span>
                ) : health?.status === "healthy" ? (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Unavailable
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {health ? `${health.service} (${health.status})` : error || "FastAPI Python Service"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {apiBaseUrl} {latency !== null && `• ${latency}ms`}
              </p>
            </div>
          </div>
        </div>

        {/* Database & Commerce Engine Info */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 mb-6 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
            <Database className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 text-sm">PostgreSQL 16 & Cart Engine</span>
              <span className="text-xs font-semibold text-emerald-600">Active</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Alembic Migrations applied • Row-level inventory locking • Bounded state transitions
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            Razorpay AI Buildathon — Track 01: AI Growth & Agentic Commerce
          </span>
          <button
            onClick={checkBackendHealth}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Status
          </button>
        </div>
      </div>

      {/* Floating AI Assistant Drawer */}
      <AIAssistantDrawer />
    </main>
  );
}
