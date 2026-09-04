"use client";

import Link from "next/link";
import {
  Sparkles,
  Bot,
  Shield,
  Activity,
  Zap,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  Lock,
  ArrowRight
} from "lucide-react";
import MerchantSidebar from "@/components/MerchantSidebar";
import MerchantHeader from "@/components/MerchantHeader";
import BentoCard from "@/components/BentoCard";
import KpiMetricCard from "@/components/KpiMetricCard";

export default function AICommerceOverviewPage() {
  const toolStats = [
    { tool: "search_catalog", calls: 4890, avgMs: 42, role: "Discovery" },
    { tool: "get_product_details", calls: 3210, avgMs: 18, role: "Spec Inspection" },
    { tool: "evaluate_policy", calls: 1940, avgMs: 8, role: "Deterministic Check" },
    { tool: "add_to_cart", calls: 890, avgMs: 24, role: "Cart Modification" },
    { tool: "get_cart", calls: 1420, avgMs: 12, role: "Cart Inspection" },
    { tool: "clear_cart", calls: 62, avgMs: 16, role: "Cart Reset" },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <MerchantSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MerchantHeader
          title="AI Commerce Overview"
          subtitle="Autonomous agent efficiency benchmarks, tool execution volume, and safety boundaries"
          breadcrumbs={[{ label: "Merchant", href: "/merchant" }, { label: "AI Overview" }]}
          isSimulated={true}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Executive Overview Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiMetricCard
              title="Agent Queries (24h)"
              value="12,412"
              trend="+18.4%"
              trendPositive={true}
              subtext="Gemini 2.0 Bounded Flash"
              icon={Bot}
            />
            <KpiMetricCard
              title="Avg Reasoning Latency"
              value="1.42s"
              trend="-120ms"
              trendPositive={true}
              subtext="Includes 7 tool evaluations"
              icon={Zap}
            />
            <KpiMetricCard
              title="Prompt Injection Defeated"
              value="28 / 28"
              trend="100% Isolated"
              trendPositive={true}
              subtext="Zero parameter escaping"
              icon={Shield}
            />
            <KpiMetricCard
              title="Assisted Cart Value"
              value="₹38.4L"
              trend="+24.1%"
              trendPositive={true}
              subtext="79.2% of total volume"
              icon={TrendingUp}
            />
          </div>

          {/* 7 Bounded Tools Execution Matrix (Stitch: ai_commerce_overview) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-display font-bold text-base text-navy-900">
                    7 Bounded Tools Execution Matrix
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Strict parameter type enforcement • Zero payment tool availability
                  </p>
                </div>
                <span className="text-xs font-mono-data text-growth-dark font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Zero Hallucinations
                </span>
              </div>

              <div className="overflow-x-auto font-mono-data text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-400">
                      <th className="p-3">Bounded Tool Name</th>
                      <th className="p-3">Operational Role</th>
                      <th className="p-3">Invocations (24h)</th>
                      <th className="p-3">Avg Latency</th>
                      <th className="p-3 text-right">Boundary Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {toolStats.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 font-bold text-navy-900">{t.tool}</td>
                        <td className="p-3 text-slate-600">{t.role}</td>
                        <td className="p-3 text-navy-900 font-semibold">{t.calls.toLocaleString("en-IN")}</td>
                        <td className="p-3 text-slate-500">{t.avgMs}ms</td>
                        <td className="p-3 text-right">
                          <span className="text-[10px] text-growth-dark bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                            ENFORCED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Safety Architecture Summary */}
            <div className="lg:col-span-4 space-y-6">
              <BentoCard
                title="AI Boundary Principles"
                subtitle="Governing Architectural Law"
                badge="Safety Core"
                badgeType="ai"
              >
                <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                  <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                    <strong className="text-ai-violet block mb-0.5">1. AI Proposes Only</strong>
                    The agent can query catalog and recommend items into the cart, but cannot authorize spending.
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <strong className="text-growth-dark block mb-0.5">2. Deterministic Verification</strong>
                    Policy limits and stock reservations are computed purely by deterministic Python/PostgreSQL logic.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="text-navy-900 block mb-0.5">3. Human-in-the-Loop</strong>
                    Transactions require signed buyer consent before Razorpay server orders can be created.
                  </div>
                </div>
              </BentoCard>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
