"use client";

import { LineChart, BarChart3, TrendingUp, PieChart, Users, Sparkles, Filter } from "lucide-react";
import MerchantSidebar from "@/components/MerchantSidebar";
import MerchantHeader from "@/components/MerchantHeader";
import BentoCard from "@/components/BentoCard";
import KpiMetricCard from "@/components/KpiMetricCard";

export default function AICommerceAnalyticsPage() {
  const categoryAov = [
    { category: "Engineering Laptops", aov: 58499, sharePct: 54, growth: "+16%" },
    { category: "4K Developer Displays", aov: 28990, sharePct: 22, growth: "+8%" },
    { category: "Mechanical Keyboards", aov: 7450, sharePct: 14, growth: "+21%" },
    { category: "Focus & Audio Gear", aov: 5200, sharePct: 10, growth: "+4%" },
  ];

  const searchClusters = [
    { query: "Lightweight laptop for CAD and compilation", hits: 1420, conversion: "34%" },
    { query: "Mechanical keyboard silent red switches", hits: 890, conversion: "28%" },
    { query: "External monitor USB-C single cable setup", hits: 670, conversion: "41%" },
    { query: "Student discount budget laptop under 50k", hits: 1890, conversion: "22%" },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <MerchantSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MerchantHeader
          title="Commerce Analytics & Insights"
          subtitle="Conversion velocity curves, category AOV distribution, and search intent clusters"
          breadcrumbs={[{ label: "Merchant", href: "/merchant" }, { label: "Analytics" }]}
          isSimulated={true}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiMetricCard
              title="Cart Conversion Rate"
              value="28.4%"
              trend="+3.6%"
              trendPositive={true}
              subtext="AI-assisted discovery"
              icon={TrendingUp}
            />
            <KpiMetricCard
              title="Blended AOV"
              value="₹24,850"
              trend="+₹3,200"
              trendPositive={true}
              subtext="Driven by student bundles"
              icon={BarChart3}
            />
            <KpiMetricCard
              title="Policy Pass Ratio"
              value="98.2%"
              trend="Nominal"
              trendPositive={true}
              subtext="1.8% intercepted"
              icon={LineChart}
            />
            <KpiMetricCard
              title="Repeat Buyer Rate"
              value="41.5%"
              trend="+5.2%"
              trendPositive={true}
              subtext="University semester cycle"
              icon={Users}
            />
          </div>

          {/* Category AOV Distribution & Query Intent Clusters */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 6 cols: Category AOV Distribution */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <h3 className="font-display font-bold text-base text-navy-900">
                  Category AOV & Revenue Share
                </h3>
                <span className="text-xs font-mono-data text-slate-400">Past 30 Days</span>
              </div>

              <div className="space-y-4">
                {categoryAov.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-navy-900">{item.category}</span>
                      <span className="font-mono-data font-bold text-growth-dark bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {item.growth}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-ai-violet to-growth-emerald"
                        style={{ width: `${item.sharePct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono-data">
                      <span>AOV: ₹{item.aov.toLocaleString("en-IN")}</span>
                      <span>{item.sharePct}% Total Share</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 6 cols: Search Intent Clusters */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-ai-violet" />
                  <h3 className="font-display font-bold text-base text-navy-900">
                    High-Intent Query Clusters
                  </h3>
                </div>
                <span className="text-xs font-mono-data text-ai-violet font-semibold">
                  NLP Clustered
                </span>
              </div>

              <div className="space-y-3">
                {searchClusters.map((cluster, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4 text-xs font-mono-data"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-navy-900 font-sans font-medium line-clamp-1">
                        &quot;{cluster.query}&quot;
                      </p>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {cluster.hits.toLocaleString("en-IN")} student queries
                      </span>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Conversion
                      </span>
                      <span className="font-bold text-growth-dark text-xs">
                        {cluster.conversion}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
