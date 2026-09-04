"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Search, ArrowRight, ShieldCheck, Clock, Terminal, Filter } from "lucide-react";
import MerchantSidebar from "@/components/MerchantSidebar";
import MerchantHeader from "@/components/MerchantHeader";
import StatusPip from "@/components/StatusPip";
import { DEFAULT_ACTIVE_SESSIONS, ActiveBuyerSession } from "@/lib/telemetry-adapter";

export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState<ActiveBuyerSession[]>(DEFAULT_ACTIVE_SESSIONS);
  const [tierFilter, setTierFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const filtered = sessions.filter((s) => {
    if (tierFilter !== "ALL" && s.studentTier !== tierFilter) return false;
    if (search && !s.intentPrompt.toLowerCase().includes(search.toLowerCase()) && !s.sessionId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <MerchantSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MerchantHeader
          title="Active AI Buyer Sessions"
          subtitle="Real-time session monitoring: cart values, browsing intent, and risk scores"
          breadcrumbs={[{ label: "Merchant", href: "/merchant" }, { label: "Sessions" }]}
          isSimulated={true}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Filter Controls (active_ai_buyer_sessions) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-ai-violet">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base text-navy-900">
                  Student Session Monitor
                </h2>
                <p className="text-xs text-slate-500">
                  {filtered.length} active sessions under policy surveillance
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search intent or session ID..."
                className="w-56 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-navy-900 font-mono-data focus:outline-none focus:border-ai-violet"
              />
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-navy-900 font-mono-data"
              >
                <option value="ALL">All Tiers</option>
                <option value="TIER_1">Tier 1 (₹10k)</option>
                <option value="TIER_2">Tier 2 (₹25k)</option>
                <option value="TIER_3">Tier 3 (₹50k)</option>
              </select>
            </div>
          </div>

          {/* Sessions Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono-data">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-400">
                    <th className="p-3.5">Session ID</th>
                    <th className="p-3.5">Tier</th>
                    <th className="p-3.5">Student Intent Prompt</th>
                    <th className="p-3.5">Cart Total</th>
                    <th className="p-3.5">Risk Score</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Trace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 text-navy-900 font-bold">{s.sessionId}</td>
                      <td className="p-3.5">
                        <span className="text-[10px] text-ai-violet bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-bold">
                          {s.studentTier}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 font-sans max-w-xs truncate" title={s.intentPrompt}>
                        &quot;{s.intentPrompt}&quot;
                      </td>
                      <td className="p-3.5 text-navy-900 font-bold">
                        ₹{s.cartTotalInr.toLocaleString("en-IN")} ({s.cartItemCount} items)
                      </td>
                      <td className="p-3.5">
                        <span className={`font-bold ${s.riskScore > 60 ? "text-rose-600" : "text-growth-dark"}`}>
                          {s.riskScore} / 100
                        </span>
                      </td>
                      <td className="p-3.5">
                        <StatusPip status={s.currentStep} size="sm" />
                      </td>
                      <td className="p-3.5 text-right">
                        <Link
                          href={`/merchant/sessions/trace?session_id=${s.sessionId}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-ai-violet hover:underline"
                        >
                          <span>Inspect Trace</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
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
