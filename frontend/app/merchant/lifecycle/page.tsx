"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GitCommit,
  Sparkles,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Lock,
  FileText,
  RotateCcw
} from "lucide-react";
import MerchantSidebar from "@/components/MerchantSidebar";
import MerchantHeader from "@/components/MerchantHeader";

export default function LiveTransactionLifecyclePage() {
  const [activePhase, setActivePhase] = useState<number>(2);

  const phases = [
    {
      id: 1,
      title: "Phase 1: Intent Formulation",
      actor: "AI AGENT & BUYER",
      badge: "Discovery",
      description: "Student queries catalog via natural language prompt. Gemini 2.0 bounded agent evaluates requirements and proposes matching SKUs into the cart.",
      status: "COMPLETED",
      details: [
        "7 Bounded tools isolate prompt injections",
        "Integer paise pricing calculated authoritatively",
        "Row-level inventory lock prepared",
      ],
    },
    {
      id: 2,
      title: "Phase 2: Deterministic Policy Gate",
      actor: "POLICY ENGINE",
      badge: "Governance",
      description: "Strict Python deterministic engine computes spending limits, daily thresholds, and restricted categories. Explicit buyer authorization required.",
      status: "ACTIVE",
      details: [
        "Zero AI payment authority enforced",
        "Student Tier 1/2/3 limit verification",
        "Cryptographic buyer approval token generated",
      ],
    },
    {
      id: 3,
      title: "Phase 3: Razorpay Test Mode",
      actor: "PAYMENT GATEWAY",
      badge: "Execution",
      description: "Server-side Razorpay order created via authentic API credentials. Payment verified via HMAC-SHA256 signature verification.",
      status: "PENDING",
      details: [
        "Order created only after signed policy pass",
        "Test Mode sandbox popup opens in buyer view",
        "Public HTTPS webhook handles asynchronous notifications",
      ],
    },
    {
      id: 4,
      title: "Phase 4: Immutable Settlement",
      actor: "POSTGRESQL 16 ENGINE",
      badge: "Settlement",
      description: "Final state written to append-only immutable audit trail with correlation IDs, actor types, and finalized inventory decrement.",
      status: "PENDING",
      details: [
        "Database triggers prohibit record mutation",
        "Delivery fulfillment trigger dispatched",
        "Complete provenance audit record published",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <MerchantSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MerchantHeader
          title="Live Transaction Lifecycle State Machine"
          subtitle="4-Phase deterministic pipeline: from AI intent formulation to immutable settlement"
          breadcrumbs={[{ label: "Merchant", href: "/merchant" }, { label: "Transaction Lifecycle" }]}
          isSimulated={true}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header Strip (live_transaction_lifecycle) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-display text-navy-900">
                  Transaction State Machine Pipeline
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Visual state progression ensuring that AI proposing never bypasses deterministic verification or payment gates.
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono-data text-xs">
                <span className="text-slate-400">Current Simulation Phase:</span>
                <span className="px-2.5 py-1 rounded-full bg-navy-900 text-white font-bold">
                  Phase {activePhase} / 4
                </span>
              </div>
            </div>
          </div>

          {/* 4 Phases Flow Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {phases.map((p) => {
              const isSelected = activePhase === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setActivePhase(p.id)}
                  className={`rounded-2xl border p-5 cursor-pointer transition-all ${
                    isSelected
                      ? "border-purple-400 bg-white shadow-md ring-2 ring-purple-100"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono-data font-bold uppercase tracking-wider text-slate-400">
                      {p.badge}
                    </span>
                    <span
                      className={`text-[9px] font-mono-data font-bold uppercase px-2 py-0.5 rounded-full border ${
                        p.status === "COMPLETED"
                          ? "bg-emerald-50 text-growth-dark border-emerald-200"
                          : p.status === "ACTIVE"
                          ? "bg-purple-50 text-ai-violet border-purple-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-sm text-navy-900">
                    {p.title}
                  </h3>
                  <span className="text-[10px] font-mono-data text-slate-400 block mt-0.5">
                    Actor: {p.actor}
                  </span>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {p.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] font-semibold text-ai-violet flex items-center justify-between">
                    <span>Inspect Pipeline Node</span>
                    <span>→</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Selected Phase Node Inspector */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-base text-navy-900">
                {phases[activePhase - 1].title} — Node Inspector
              </h3>
              <span className="text-xs font-mono-data font-bold text-growth-dark bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Zero Leaks Verified
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {phases[activePhase - 1].description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {phases[activePhase - 1].details.map((d, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-mono-data text-slate-700 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-growth-emerald flex-shrink-0 mt-0.5" />
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
