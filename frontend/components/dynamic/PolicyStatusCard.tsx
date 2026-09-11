"use client";

import { ShieldCheck, ShieldAlert, AlertTriangle, Lock, Info } from "lucide-react";

export type PolicyDecision = "ALLOW" | "AUTHORIZATION_REQUIRED" | "BLOCK";

interface PolicyStatusCardProps {
  decision: PolicyDecision;
  policyTier?: string;
  cartTotalInr: number;
  remainingBufferInr?: number;
  maxCartTotalInr?: number;
  reasons?: { code: string; message: string }[];
  className?: string;
  compact?: boolean;
}

export default function PolicyStatusCard({
  decision,
  policyTier = "TIER_2",
  cartTotalInr,
  remainingBufferInr,
  maxCartTotalInr = 40000,
  reasons = [],
  className = "",
  compact = false,
}: PolicyStatusCardProps) {
  const config = {
    ALLOW: {
      title: "Policy Verified: Permitted",
      badge: "ALLOW",
      badgeBg: "bg-emerald-50 text-growth-dark border-emerald-300",
      border: "border-emerald-200/90",
      bg: "bg-emerald-50/30",
      icon: <ShieldCheck className="w-4 h-4 text-growth-dark" />,
      description: "Cart total is within your student tier limits. Standard checkout enabled.",
    },
    AUTHORIZATION_REQUIRED: {
      title: "Authorization Required",
      badge: "AUTH REQUIRED",
      badgeBg: "bg-amber-50 text-amber-800 border-amber-300",
      border: "border-amber-200/90",
      bg: "bg-amber-50/40",
      icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
      description: "Transaction exceeds automated single-item threshold. Explicit buyer sign-off needed before payment.",
    },
    BLOCK: {
      title: "Transaction Blocked",
      badge: "BLOCKED",
      badgeBg: "bg-rose-50 text-rose-800 border-rose-300",
      border: "border-rose-200/90",
      bg: "bg-rose-50/40",
      icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
      description: "Cart total exceeds maximum student tier cap. Please reduce items or upgrade university verification.",
    },
  }[decision] || {
    title: "Policy Evaluation",
    badge: "EVALUATING",
    badgeBg: "bg-slate-100 text-slate-700 border-slate-300",
    border: "border-slate-200",
    bg: "bg-white",
    icon: <Lock className="w-4 h-4 text-slate-500" />,
    description: "Evaluating cart against deterministic spending policies...",
  };

  const bufferFormatted = typeof remainingBufferInr === "number"
    ? `₹${Math.max(0, remainingBufferInr).toLocaleString("en-IN")}`
    : "Verified";

  if (compact) {
    return (
      <div className={`rounded-xl border ${config.border} ${config.bg} p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {config.icon}
            <span className="text-xs font-bold text-navy-900">{config.title}</span>
          </div>
          <span className={`text-[10px] font-mono-data font-bold px-2 py-0.5 rounded border ${config.badgeBg}`}>
            {config.badge}
          </span>
        </div>
        <p className="text-[11px] text-slate-600 mt-1">{config.description}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border ${config.border} bg-white p-5 shadow-xs ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
            {config.icon}
          </div>
          <div>
            <h4 className="font-display font-bold text-xs sm:text-sm text-navy-900">
              Deterministic Spending Policy
            </h4>
            <span className="text-[10px] font-mono-data text-slate-500 uppercase">
              Tier: {policyTier}
            </span>
          </div>
        </div>

        <span className={`text-[10px] font-mono-data font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${config.badgeBg}`}>
          {config.badge}
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 mb-3 font-mono-data text-xs">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Cart Total</span>
          <span className="font-bold text-navy-900 text-sm mt-0.5 block">
            ₹{cartTotalInr.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tier Cap</span>
          <span className="font-bold text-slate-700 text-sm mt-0.5 block">
            ₹{maxCartTotalInr.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Status Explanation */}
      <div className={`p-3 rounded-xl ${config.bg} border ${config.border} text-xs text-slate-700 leading-relaxed`}>
        <p className="font-semibold text-navy-900 mb-0.5">{config.title}</p>
        <p className="text-[11px] text-slate-600">{config.description}</p>

        {reasons.length > 0 && (
          <ul className="mt-2 space-y-1 text-[11px] font-mono-data text-slate-700 border-t border-slate-200/60 pt-2">
            {reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-slate-400">•</span>
                <span>{r.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Governance Rule Strip */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono-data text-slate-400">
        <span>AI proposes • Policy verifies • You authorize</span>
        <span className="text-growth-dark font-semibold">0% AI Payment Authority</span>
      </div>
    </div>
  );
}
