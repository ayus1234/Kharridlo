"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Sparkles, Clock, ShieldCheck } from "lucide-react";

export interface ActivityEvent {
  id: string;
  title: string;
  detail?: string;
  timestamp?: string;
  completed?: boolean;
}

interface AgentActivityTimelineProps {
  events?: ActivityEvent[];
  currentState?: "DISCOVERY" | "CART" | "AUTHORIZATION" | "PAYMENT" | "ORDER_CONFIRMED";
  className?: string;
  defaultExpanded?: boolean;
}

const DEFAULT_EVENTS: Record<string, ActivityEvent[]> = {
  ORDER_CONFIRMED: [
    { id: "e1", title: "Understood student requirements", detail: "Extracted course & hardware specifications", completed: true },
    { id: "e2", title: "Curated matching catalog items", detail: "Filtered verified engineering & developer hardware", completed: true },
    { id: "e3", title: "Deterministic policy check executed", detail: "Tier spending threshold evaluated and approved", completed: true },
    { id: "e4", title: "Explicit buyer authorization received", detail: "Cryptographic intent confirmed by buyer", completed: true },
    { id: "e5", title: "Razorpay Test Mode payment verified", detail: "HMAC-SHA256 signature verified by server", completed: true },
    { id: "e6", title: "Order confirmed & logged to audit ledger", detail: "Immutable transaction hash registered", completed: true },
  ],
  AUTHORIZATION: [
    { id: "e1", title: "Understood student requirements", detail: "Identified hardware & budget parameters", completed: true },
    { id: "e2", title: "Found matching products", detail: "Evaluated student value & component specs", completed: true },
    { id: "e3", title: "Items added to cart", detail: "Inventory reservation locked for session", completed: true },
    { id: "e4", title: "Policy check completed", detail: "Transaction verified against student spending limit", completed: true },
    { id: "e5", title: "Awaiting buyer authorization", detail: "AI has zero payment authority. Ready for your review", completed: false },
  ],
  CART: [
    { id: "e1", title: "Understood student requirements", detail: "Identified hardware & budget parameters", completed: true },
    { id: "e2", title: "Hardware verified in catalog", detail: "Checked pricing & student availability", completed: true },
    { id: "e3", title: "Cart updated", detail: "Session cart synchronized with policy engine", completed: true },
    { id: "e4", title: "Policy evaluation active", detail: "Checking tier thresholds", completed: true },
  ],
};

export default function AgentActivityTimeline({
  events,
  currentState = "ORDER_CONFIRMED",
  className = "",
  defaultExpanded = false,
}: AgentActivityTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const resolvedEvents = events && events.length > 0
    ? events
    : (DEFAULT_EVENTS[currentState] || DEFAULT_EVENTS.ORDER_CONFIRMED);

  return (
    <div className={`rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden ${className}`}>
      {/* Header / Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-growth-dark">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display font-bold text-xs sm:text-sm text-navy-900">
                Kharridlo Activity Timeline
              </h4>
              <span className="text-[10px] font-mono-data font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                Verified Safe Events
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Audit log of system actions • Zero hidden prompts or chain-of-thought
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>{isExpanded ? "Hide details" : "View activity"}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expandable Timeline Body */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/40">
          <div className="relative pl-6 space-y-4 pt-3 before:absolute before:left-2.5 before:top-4 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {resolvedEvents.map((event) => (
              <div key={event.id} className="relative">
                {/* Dot */}
                <div
                  className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white ${
                    event.completed !== false
                      ? "bg-growth-emerald"
                      : "bg-slate-300 ring-2 ring-white"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>

                <div>
                  <h5 className="font-display font-bold text-xs text-navy-900">
                    {event.title}
                  </h5>
                  {event.detail && (
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      {event.detail}
                    </p>
                  )}
                  {event.timestamp && (
                    <span className="text-[10px] font-mono-data text-slate-400 block mt-0.5">
                      {event.timestamp}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono-data text-slate-400">
            <span>Deterministic verification • Razorpay Test Mode</span>
            <span className="text-growth-dark font-medium">Audited & Settled</span>
          </div>
        </div>
      )}
    </div>
  );
}
