"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Terminal, Sparkles, CheckCircle2, Clock, ShieldCheck, Zap } from "lucide-react";
import MerchantSidebar from "@/components/MerchantSidebar";
import MerchantHeader from "@/components/MerchantHeader";
import StatusPip from "@/components/StatusPip";

function TraceContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") || "sess_a8f921_1725450";

  const traceSteps = [
    {
      step: 1,
      tool: "search_catalog",
      durationMs: 44,
      tokens: 382,
      status: "COMPLETED",
      input: '{ category: "laptop", max_price_paise: 5000000, keyword: "lightweight" }',
      output: '{ count: 3, top_sku: "SKU-TECH-PRO15", availability: "in_stock" }',
    },
    {
      step: 2,
      tool: "get_product_details",
      durationMs: 18,
      tokens: 240,
      status: "COMPLETED",
      input: '{ product_id: "prod_laptop_001" }',
      output: '{ specs: { cpu: "i7-13700H", ram: "16GB", ssd: "512GB" }, price_inr: 45999 }',
    },
    {
      step: 3,
      tool: "evaluate_policy",
      durationMs: 6,
      tokens: 185,
      status: "COMPLETED",
      input: '{ session_id: "' + sessionId + '", amount_paise: 4599900 }',
      output: '{ decision: "ALLOW", tier: "TIER_1", authorization_required: true }',
    },
    {
      step: 4,
      tool: "add_to_cart",
      durationMs: 22,
      tokens: 190,
      status: "COMPLETED",
      input: '{ session_id: "' + sessionId + '", product_id: "prod_laptop_001", quantity: 1 }',
      output: '{ cart_id: "cart_8921a", total_items: 1, total_inr: 45999 }',
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <MerchantSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MerchantHeader
          title="Agent Activity Trace Explorer"
          subtitle={`Chronological execution trace for session ${sessionId}`}
          breadcrumbs={[
            { label: "Merchant", href: "/merchant" },
            { label: "Sessions", href: "/merchant/sessions" },
            { label: "Trace" },
          ]}
          isSimulated={true}
        />

        <main className="flex-1 p-6 space-y-6 max-w-5xl w-full mx-auto">
          {/* Header Card (agent_activity_trace) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
              <div>
                <Link
                  href="/merchant/sessions"
                  className="text-xs text-slate-500 hover:text-navy-900 flex items-center gap-1 mb-2 font-medium"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Sessions
                </Link>
                <h2 className="font-display font-bold text-lg text-navy-900">
                  Execution Trace: <span className="font-mono-data text-ai-violet">{sessionId}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Model: <span className="font-mono-data text-slate-700 font-semibold">Gemini 2.0 Flash Bounded</span> • Total Steps: 4 • Tokens: 997
                </p>
              </div>

              <Link
                href={`/merchant/sessions/policy-trace?session_id=${sessionId}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-navy-900 text-white text-xs font-semibold hover:bg-ai-violet transition-colors shadow-sm"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-growth-emerald" />
                <span>Inspect Policy Checkpoint</span>
              </Link>
            </div>

            {/* Trace Steps Timeline */}
            <div className="space-y-6 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {traceSteps.map((s) => (
                <div key={s.step} className="relative space-y-2">
                  <div className="absolute -left-6 top-1 h-5 w-5 rounded-full bg-white border-2 border-ai-violet flex items-center justify-center text-[10px] font-bold text-ai-violet font-mono-data shadow-2xs">
                    {s.step}
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 font-mono-data text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy-900">Tool: {s.tool}</span>
                        <span className="text-[10px] text-slate-400">({s.durationMs}ms)</span>
                      </div>
                      <span className="text-[10px] text-growth-dark bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                        {s.status}
                      </span>
                    </div>

                    <div className="text-[11px] bg-white p-2.5 rounded-lg border border-slate-200/80 space-y-1">
                      <div>
                        <span className="text-slate-400">Input: </span>
                        <span className="text-slate-800">{s.input}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Output: </span>
                        <span className="text-slate-800">{s.output}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Tokens consumed: {s.tokens}</span>
                      <span>Zero side-effects outside bounded schema</span>
                    </div>
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

export default function AgentActivityTracePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-mono-data text-xs text-slate-400">Loading Agent Activity Trace...</div>}>
      <TraceContent />
    </Suspense>
  );
}
