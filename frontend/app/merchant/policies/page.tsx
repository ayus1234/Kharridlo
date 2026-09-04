"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, ArrowRight, CheckCircle2, Lock, Plus, Sliders, AlertTriangle } from "lucide-react";
import MerchantSidebar from "@/components/MerchantSidebar";
import MerchantHeader from "@/components/MerchantHeader";
import StatusPip from "@/components/StatusPip";
import { DEFAULT_POLICY_RULES, PolicyRuleDefinition } from "@/lib/telemetry-adapter";

export default function PolicyCenterPage() {
  const [rules, setRules] = useState<PolicyRuleDefinition[]>(DEFAULT_POLICY_RULES);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <MerchantSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MerchantHeader
          title="Policy Center & Rule Governance"
          subtitle="Deterministic spending limits, student tier thresholds, and restricted commercial categories"
          breadcrumbs={[{ label: "Merchant", href: "/merchant" }, { label: "Policy Center" }]}
          isSimulated={true}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Info Strip (policy_center) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-5 w-5 text-growth-emerald" />
                <h2 className="font-display font-bold text-lg text-navy-900">
                  Deterministic Rule Engines Active
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Rules are evaluated strictly by backend code. AI agent prompts cannot override these thresholds.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/merchant/policies/alerts"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Interception Alerts</span>
              </Link>

              <Link
                href="/merchant/investigation"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-navy-900 text-white hover:bg-ai-violet transition-colors shadow-sm"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Policy Investigation</span>
              </Link>
            </div>
          </div>

          {/* Active Tiers Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rules.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono-data font-bold text-ai-violet bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {r.tier}
                    </span>
                    <StatusPip status={r.activeStatus} size="sm" />
                  </div>

                  <h3 className="font-display font-bold text-base text-navy-900">
                    {r.tierName}
                  </h3>

                  <div className="my-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2 font-mono-data text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Max Single Tx:</span>
                      <strong className="text-navy-900">₹{r.maxSingleTxInr.toLocaleString("en-IN")}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Max Daily Cap:</span>
                      <strong className="text-navy-900">₹{r.maxDailyTxInr.toLocaleString("en-IN")}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Buyer Auth:</span>
                      <span className="text-growth-dark font-bold">REQUIRED</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <span className="text-[10px] font-mono-data uppercase font-bold text-slate-400 block">
                      Restricted Categories:
                    </span>
                    {r.restrictedCategories.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {r.restrictedCategories.map((c, i) => (
                          <span key={i} className="text-[10px] font-mono-data bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">None (Unrestricted research tier)</span>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-mono-data">
                    {r.enforcedCountLast24h} enforces (24h)
                  </span>
                  <Link
                    href={`/merchant/policies/${r.id}`}
                    className="font-bold text-ai-violet hover:underline flex items-center gap-1"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
