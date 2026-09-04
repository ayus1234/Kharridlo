"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, Sliders, Shield, ArrowRight, Download, Terminal, CheckCircle2 } from "lucide-react";
import MerchantSidebar from "@/components/MerchantSidebar";
import MerchantHeader from "@/components/MerchantHeader";

export default function MerchantPolicyInvestigationPage() {
  const [querySession, setQuerySession] = useState("");
  const [queryRule, setQueryRule] = useState("ALL");
  const [queryActor, setQueryActor] = useState("ALL");
  const [hasQueried, setHasQueried] = useState(true);

  const sampleResults = [
    {
      id: "inv_01",
      timestamp: "Today, 11:24 AM",
      sessionId: "sess_a8f921_1725450",
      rule: "TIER_1_SPENDING_LIMIT",
      actor: "POLICY_ENGINE",
      decision: "ALLOW",
      cartTotal: "₹45,999",
      reason: "Within verified limits, explicit buyer authorization received.",
    },
    {
      id: "inv_02",
      timestamp: "Today, 10:48 AM",
      sessionId: "sess_e109ff_1725454",
      rule: "TIER_1_DAILY_CAP",
      actor: "POLICY_ENGINE",
      decision: "BLOCK",
      cartTotal: "₹16,500",
      reason: "Breached rolling daily ceiling of ₹10,000 for unverified tier.",
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <MerchantSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MerchantHeader
          title="Merchant Policy Investigation Console"
          subtitle="Queryable forensic investigation workbench for policy evaluation events and audit trails"
          breadcrumbs={[
            { label: "Merchant", href: "/merchant" },
            { label: "Policy Center", href: "/merchant/policies" },
            { label: "Investigation" },
          ]}
          isSimulated={true}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Query Filter Builder (merchant_policy_investigation) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-ai-violet" />
                <h3 className="font-display font-bold text-sm text-navy-900">
                  Forensic Query Builder
                </h3>
              </div>
              <span className="text-[10px] font-mono-data text-slate-400 uppercase">
                Zero PII Capturing
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono-data">
              <div>
                <label className="text-slate-500 text-[10px] uppercase font-bold block mb-1">
                  Session ID or Correlation ID
                </label>
                <input
                  type="text"
                  value={querySession}
                  onChange={(e) => setQuerySession(e.target.value)}
                  placeholder="e.g. sess_a8f921..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-navy-900 focus:outline-none focus:border-ai-violet"
                />
              </div>

              <div>
                <label className="text-slate-500 text-[10px] uppercase font-bold block mb-1">
                  Rule Code
                </label>
                <select
                  value={queryRule}
                  onChange={(e) => setQueryRule(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-navy-900 focus:outline-none focus:border-ai-violet"
                >
                  <option value="ALL">All Rule Codes</option>
                  <option value="TIER_1_LIMIT">TIER_1_SPENDING_LIMIT</option>
                  <option value="TIER_2_LIMIT">TIER_2_SPENDING_LIMIT</option>
                  <option value="RESTRICTED_CATEGORY">RESTRICTED_CATEGORY</option>
                  <option value="AUTH_TOKEN_CHECK">AUTH_TOKEN_CHECK</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 text-[10px] uppercase font-bold block mb-1">
                  Actor Type
                </label>
                <select
                  value={queryActor}
                  onChange={(e) => setQueryActor(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-navy-900 focus:outline-none focus:border-ai-violet"
                >
                  <option value="ALL">All Actors</option>
                  <option value="POLICY_ENGINE">POLICY_ENGINE</option>
                  <option value="BUYER">BUYER</option>
                  <option value="AI_AGENT">AI_AGENT</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-mono-data">
                Deterministic index scan across audit partitions
              </span>
              <button
                onClick={() => setHasQueried(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-semibold hover:bg-ai-violet transition-colors"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Execute Query</span>
              </button>
            </div>
          </div>

          {/* Investigation Results Ledger */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono-data">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-400">
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Session ID</th>
                    <th className="p-3.5">Rule Evaluated</th>
                    <th className="p-3.5">Actor</th>
                    <th className="p-3.5">Decision</th>
                    <th className="p-3.5">Cart Total</th>
                    <th className="p-3.5 text-right">Reasoning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sampleResults.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">{r.timestamp}</td>
                      <td className="p-3.5 font-bold text-navy-900">{r.sessionId}</td>
                      <td className="p-3.5 text-ai-violet font-semibold">{r.rule}</td>
                      <td className="p-3.5 text-slate-600">{r.actor}</td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            r.decision === "ALLOW"
                              ? "bg-emerald-50 text-growth-dark border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {r.decision}
                        </span>
                      </td>
                      <td className="p-3.5 text-navy-900 font-bold">{r.cartTotal}</td>
                      <td className="p-3.5 text-right font-sans text-slate-600 max-w-xs truncate">
                        {r.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
