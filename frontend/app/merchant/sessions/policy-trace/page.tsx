"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, CheckCircle2, AlertTriangle, Lock, FileText } from "lucide-react";
import MerchantSidebar from "@/components/MerchantSidebar";
import MerchantHeader from "@/components/MerchantHeader";

function PolicyTraceContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") || "sess_a8f921_1725450";

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <MerchantSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MerchantHeader
          title="Agent Trace & Policy Enforcement"
          subtitle={`Deterministic governance audit for session ${sessionId}`}
          breadcrumbs={[
            { label: "Merchant", href: "/merchant" },
            { label: "Sessions", href: "/merchant/sessions" },
            { label: "Policy Enforcement" },
          ]}
          isSimulated={true}
        />

        <main className="flex-1 p-6 space-y-6 max-w-4xl w-full mx-auto">
          {/* Main Card (agent_trace_policy_enforcement) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <Link
                href={`/merchant/sessions/trace?session_id=${sessionId}`}
                className="text-xs text-slate-500 hover:text-navy-900 flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Tool Trace
              </Link>
              <span className="text-[10px] font-mono-data font-bold text-growth-dark bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                POLICY DECISION: ALLOW
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white font-mono-data text-xs space-y-2">
              <div className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                Deterministic Rule Enforcement Record
              </div>
              <div>Session Reference: {sessionId}</div>
              <div>Policy Tier: TIER_1 (Unverified Student Tier)</div>
              <div>Observed Cart Total: ₹45,999 (4,599,900 paise)</div>
              <div>Max Single Transaction Limit: ₹50,000 (5,000,000 paise)</div>
              <div>Buyer Consent Token: REQUIRED</div>
            </div>

            {/* Checkpoint Table */}
            <div className="space-y-3">
              <h3 className="font-display font-bold text-sm text-navy-900">
                Rule Evaluation Pipeline
              </h3>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between font-mono-data">
                  <span className="font-bold text-navy-900">Rule 1: Spending Limit Tier Cap</span>
                  <span className="text-growth-dark font-bold">PASSED</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Cart value ₹45,999 satisfies ceiling requirement for student hardware category.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between font-mono-data">
                  <span className="font-bold text-navy-900">Rule 2: Restricted Merchant Catalog Check</span>
                  <span className="text-growth-dark font-bold">PASSED</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  SKU &quot;SKU-TECH-PRO15&quot; is in approved student electronics catalog. No bulk or commercial flags.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between font-mono-data">
                  <span className="font-bold text-navy-900">Rule 3: Explicit Human Authorization Check</span>
                  <span className="text-amber-700 font-bold">GATE ACTIVE</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Requires signed cryptographic confirmation token from buyer browser session before order creation.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AgentTracePolicyEnforcementPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-mono-data text-xs text-slate-400">Loading Policy Enforcement Trace...</div>}>
      <PolicyTraceContent />
    </Suspense>
  );
}
