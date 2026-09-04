"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Sparkles,
  Shield,
  Radio,
  Play,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import MerchantSidebar from "@/components/MerchantSidebar";
import MerchantHeader from "@/components/MerchantHeader";
import StatusPip from "@/components/StatusPip";
import { DEFAULT_ACTIVITY_EVENTS, LiveActivityEvent } from "@/lib/telemetry-adapter";

export default function LiveActivityFeedPage() {
  const [events, setEvents] = useState<LiveActivityEvent[]>(DEFAULT_ACTIVITY_EVENTS);
  const [actorFilter, setActorFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  const filteredEvents = events.filter((e) => {
    if (actorFilter === "ALL") return true;
    return e.actor === actorFilter;
  });

  const simulateEvent = (type: "ALLOW" | "BLOCK" | "TOOL" | "PAY") => {
    const timestamp = new Date().toLocaleTimeString();
    const corrId = `corr_${Math.random().toString(36).substring(2, 8)}`;

    let newEvent: LiveActivityEvent;
    if (type === "ALLOW") {
      newEvent = {
        id: `sim_${Date.now()}`,
        isSimulated: true,
        timestamp,
        actor: "POLICY_ENGINE",
        action: "EVALUATE_POLICY_ALLOW",
        correlationId: corrId,
        sessionId: "sess_sim_interactive",
        status: "SUCCESS",
        description: "Student Tier 2 verified limit evaluated (₹22,999 <= ₹25,000). Buyer authorization checkpoint created.",
      };
    } else if (type === "BLOCK") {
      newEvent = {
        id: `sim_${Date.now()}`,
        isSimulated: true,
        timestamp,
        actor: "POLICY_ENGINE",
        action: "INTERCEPT_RESTRICTED_PURCHASE",
        correlationId: corrId,
        sessionId: "sess_sim_interactive",
        status: "BLOCKED",
        description: "Transaction blocked: Amount ₹34,000 exceeds Tier 1 unverified account cap of ₹10,000.",
      };
    } else if (type === "TOOL") {
      newEvent = {
        id: `sim_${Date.now()}`,
        isSimulated: true,
        timestamp,
        actor: "AI_AGENT",
        action: "SEARCH_CATALOG",
        correlationId: corrId,
        sessionId: "sess_sim_interactive",
        status: "SUCCESS",
        description: "Gemini bounded tool query executed for category 'monitor' with filter max_price=3000000.",
      };
    } else {
      newEvent = {
        id: `sim_${Date.now()}`,
        isSimulated: true,
        timestamp,
        actor: "RAZORPAY_GATEWAY",
        action: "PAYMENT_VERIFIED",
        correlationId: corrId,
        sessionId: "sess_sim_interactive",
        status: "SUCCESS",
        description: "Razorpay Test Mode signature HMAC-SHA256 verified successfully. Inventory locked and settled.",
      };
    }

    setEvents([newEvent, ...events]);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <MerchantSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MerchantHeader
          title="Live AI Commerce Activity Feed"
          subtitle="Real-time agent reasoning telemetry, tool executions, and interactive event simulator"
          breadcrumbs={[{ label: "Merchant", href: "/merchant" }, { label: "Activity Feed" }]}
          isSimulated={true}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Bar with Simulator Drawer Trigger (live_ai_commerce_activity_feed) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-ai-violet">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base text-navy-900">
                  Real-Time Event Stream
                </h2>
                <p className="text-xs text-slate-500">
                  Displaying {filteredEvents.length} live and simulated agent events
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={actorFilter}
                onChange={(e) => setActorFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-navy-900 font-mono-data"
              >
                <option value="ALL">All Actors</option>
                <option value="AI_AGENT">AI Agent</option>
                <option value="POLICY_ENGINE">Policy Engine</option>
                <option value="RAZORPAY_GATEWAY">Razorpay Gateway</option>
                <option value="BUYER">Buyer</option>
              </select>

              <button
                onClick={() => setSimulatorOpen(!simulatorOpen)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-navy-900 text-white text-xs font-semibold hover:bg-ai-violet transition-colors"
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>{simulatorOpen ? "Close Simulator" : "Interactive Event Simulator"}</span>
              </button>
            </div>
          </div>

          {/* Interactive Event Simulator Drawer */}
          {simulatorOpen && (
            <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono-data font-bold uppercase tracking-wider text-emerald-400">
                  Telemetry Event Simulator (Interactive Test Utility)
                </span>
                <span className="text-[10px] text-slate-400 font-mono-data">Click to fire live synthetic event</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => simulateEvent("TOOL")}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 transition-colors"
                >
                  <span className="text-[10px] font-mono-data uppercase text-purple-400 font-bold block mb-1">
                    AI Agent
                  </span>
                  <span className="text-xs font-bold block">Tool Query</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">search_catalog</span>
                </button>

                <button
                  onClick={() => simulateEvent("ALLOW")}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 transition-colors"
                >
                  <span className="text-[10px] font-mono-data uppercase text-emerald-400 font-bold block mb-1">
                    Policy Engine
                  </span>
                  <span className="text-xs font-bold block">Policy Evaluation</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">ALLOW (Tier 2)</span>
                </button>

                <button
                  onClick={() => simulateEvent("BLOCK")}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 transition-colors"
                >
                  <span className="text-[10px] font-mono-data uppercase text-rose-400 font-bold block mb-1">
                    Policy Engine
                  </span>
                  <span className="text-xs font-bold block">Policy Block</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">BLOCK (Tier 1 Limit)</span>
                </button>

                <button
                  onClick={() => simulateEvent("PAY")}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 transition-colors"
                >
                  <span className="text-[10px] font-mono-data uppercase text-indigo-400 font-bold block mb-1">
                    Razorpay
                  </span>
                  <span className="text-xs font-bold block">Payment Verified</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">HMAC Signature OK</span>
                </button>
              </div>
            </div>
          )}

          {/* Activity Feed List (activity_trace & live_ai_commerce_activity_feed) */}
          <div className="space-y-3">
            {filteredEvents.map((e) => {
              const isExpanded = expandedId === e.id;
              return (
                <div
                  key={e.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-purple-200 transition-all space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono-data text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {e.timestamp}
                      </span>
                      <span className="text-xs font-mono-data font-bold text-navy-900">
                        {e.action}
                      </span>
                      <span className="text-[10px] font-mono-data text-slate-400">
                        {e.actor}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusPip status={e.status} size="sm" />
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : e.id)}
                        className="p-1 rounded text-slate-400 hover:text-navy-900"
                        aria-label="Toggle details"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 font-sans leading-relaxed">
                    {e.description}
                  </p>

                  {/* Expanded Technical Payload */}
                  {isExpanded && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950 text-slate-300 font-mono-data text-[11px] space-y-1 animate-in fade-in">
                      <div>
                        <span className="text-slate-500">Correlation ID: </span>
                        <span className="text-emerald-400">{e.correlationId}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Session ID: </span>
                        <span className="text-slate-300">{e.sessionId}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Actor Type: </span>
                        <span className="text-ai-glow">{e.actor}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
