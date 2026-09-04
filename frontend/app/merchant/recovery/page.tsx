"use client";

import { useState } from "react";
import Link from "next/link";
import { RotateCcw, CheckCircle2, TrendingUp, Sparkles, Clock, ArrowRight, ShieldCheck } from "lucide-react";
import MerchantSidebar from "@/components/MerchantSidebar";
import MerchantHeader from "@/components/MerchantHeader";
import BentoCard from "@/components/BentoCard";
import KpiMetricCard from "@/components/KpiMetricCard";
import { DEFAULT_RECOVERY_ITEMS, InventoryRecoveryItem } from "@/lib/telemetry-adapter";

export default function AIInventoryRecoveryLogPage() {
  const [recoveries, setRecoveries] = useState<InventoryRecoveryItem[]>(DEFAULT_RECOVERY_ITEMS);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <MerchantSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MerchantHeader
          title="AI Inventory Recovery Log"
          subtitle="Real-time stockout mitigation ledger, preserved GMV metrics, and student alternative acceptance"
          breadcrumbs={[{ label: "Merchant", href: "/merchant" }, { label: "Inventory Recovery" }]}
          isSimulated={true}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiMetricCard
              title="Total Preserved GMV"
              value="₹1,62,889"
              trend="+₹44.9k today"
              trendPositive={true}
              subtext="GMV saved from stockout dropoff"
              icon={TrendingUp}
            />
            <KpiMetricCard
              title="Buyer Acceptance Rate"
              value="94.2%"
              trend="Very High"
              trendPositive={true}
              subtext="Students choosing suggested substitute"
              icon={CheckCircle2}
            />
            <KpiMetricCard
              title="Avg Substitution Latency"
              value="240ms"
              trend="Sub-second"
              trendPositive={true}
              subtext="Real-time inventory lock"
              icon={Clock}
            />
          </div>

          {/* Recovery Log Table (ai_inventory_recovery_log) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-growth-emerald" />
                <h3 className="font-display font-bold text-base text-navy-900">
                  Stockout Recovery Journal
                </h3>
              </div>
              <span className="text-xs font-mono-data text-slate-400">
                {recoveries.length} Preserved Journeys
              </span>
            </div>

            <div className="overflow-x-auto font-mono-data text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-400">
                    <th className="p-3">Time</th>
                    <th className="p-3">Depleted Product SKU</th>
                    <th className="p-3">AI Substitute Offered</th>
                    <th className="p-3">Preserved GMV</th>
                    <th className="p-3">Latency</th>
                    <th className="p-3 text-right">Student Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recoveries.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 text-slate-500 whitespace-nowrap">{r.stockoutTimestamp}</td>
                      <td className="p-3">
                        <span className="font-bold text-navy-900 block">{r.originalProductSku}</span>
                        <span className="text-[10px] text-slate-500 font-sans">{r.originalProductName}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-ai-violet block">{r.substituteProductSku}</span>
                        <span className="text-[10px] text-slate-500 font-sans">{r.substituteProductName}</span>
                      </td>
                      <td className="p-3 font-bold text-growth-dark">
                        ₹{r.preservedGmvInr.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3 text-slate-500">{r.recoveryLatencyMs}ms</td>
                      <td className="p-3 text-right">
                        <span className="text-[10px] font-bold text-growth-dark bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ACCEPTED
                        </span>
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
