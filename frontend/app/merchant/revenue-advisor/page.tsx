"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  Zap,
  Check
} from "lucide-react";
import MerchantSidebar from "@/components/MerchantSidebar";
import MerchantHeader from "@/components/MerchantHeader";
import BentoCard from "@/components/BentoCard";
import KpiMetricCard from "@/components/KpiMetricCard";
import { DEFAULT_REVENUE_OPPORTUNITIES, RevenueOpportunity } from "@/lib/telemetry-adapter";

export default function AIRevenueAdvisorPage() {
  const [opportunities, setOpportunities] = useState<RevenueOpportunity[]>(DEFAULT_REVENUE_OPPORTUNITIES);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <MerchantSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MerchantHeader
          title="AI Revenue Advisor"
          subtitle="Strategic autonomous intelligence: bundling opportunities, recovery potential, and pricing insights"
          breadcrumbs={[{ label: "Merchant", href: "/merchant" }, { label: "Revenue Advisor" }]}
          isSimulated={true}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiMetricCard
              title="Projected Pipeline Lift"
              value="₹2,96,000"
              trend="+14.2%"
              trendPositive={true}
              subtext="From 3 active opportunities"
              icon={TrendingUp}
            />
            <KpiMetricCard
              title="Confidence Score"
              value="91.0%"
              trend="High Accuracy"
              trendPositive={true}
              subtext="Based on student cohort trends"
              icon={Sparkles}
            />
            <KpiMetricCard
              title="Preserved GMV (30d)"
              value="₹1,62,889"
              trend="94% Accept"
              trendPositive={true}
              subtext="Zero-stockout substitution"
              icon={Zap}
            />
          </div>

          {/* Opportunities Stream (ai_revenue_advisor) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-ai-violet" />
                <h3 className="font-display font-bold text-base text-navy-900">
                  Active Growth & Revenue Opportunities
                </h3>
              </div>
              <span className="text-xs font-mono-data text-slate-400">
                Algorithmically Generated
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="rounded-2xl border-2 border-purple-200 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono-data font-bold uppercase tracking-wider text-ai-violet bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {opp.category}
                      </span>
                      <span className="text-[10px] font-mono-data font-bold text-growth-dark bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {opp.confidenceScore}% Confidence
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-base text-navy-900">
                      {opp.title}
                    </h4>

                    <div className="my-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-mono-data">
                      <span className="text-slate-400 text-[10px] uppercase block">
                        Projected Pipeline Lift
                      </span>
                      <strong className="text-navy-900 font-display text-lg block mt-0.5">
                        +₹{opp.projectedLiftInr.toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {opp.rationale}
                    </p>

                    <div className="mt-3 p-3 rounded-xl bg-purple-50/50 border border-purple-100 text-xs text-ai-violet font-medium">
                      💡 <strong>Action:</strong> {opp.suggestedAction}
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono-data">
                      Opportunity Ready
                    </span>
                    <button className="px-3 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-semibold hover:bg-ai-violet transition-colors">
                      Deploy Strategy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
