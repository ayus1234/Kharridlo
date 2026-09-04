"use client";

import React from "react";
import { CheckCircle2, Clock, AlertOctagon, XCircle, ShieldCheck, Sparkles } from "lucide-react";

interface StatusPipProps {
  status: string;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export default function StatusPip({
  status,
  size = "md",
  showIcon = true,
}: StatusPipProps) {
  const norm = (status || "").toUpperCase();

  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200";
  let icon = <Clock className="h-3 w-3" />;

  if (["SUCCESS", "ACTIVE", "ALLOW", "AUTHORIZED", "COMPLETED", "IN_STOCK"].includes(norm)) {
    colorClasses = "bg-emerald-50 text-growth-dark border-emerald-200";
    icon = <CheckCircle2 className="h-3 w-3 text-growth-emerald" />;
  } else if (["BLOCKED", "FAILED", "OUT_OF_STOCK", "ERROR"].includes(norm)) {
    colorClasses = "bg-rose-50 text-rose-700 border-rose-200";
    icon = <XCircle className="h-3 w-3 text-rose-600" />;
  } else if (["EVALUATING", "SIMULATED", "AI_PROPOSED", "PROCESSING"].includes(norm)) {
    colorClasses = "bg-purple-50 text-ai-violet border-purple-200";
    icon = <Sparkles className="h-3 w-3 text-ai-violet" />;
  } else if (["AUTHORIZATION_REQUIRED", "PENDING", "LOW_STOCK"].includes(norm)) {
    colorClasses = "bg-amber-50 text-amber-800 border-amber-200";
    icon = <AlertOctagon className="h-3 w-3 text-amber-600" />;
  }

  const sizeClasses = size === "sm" 
    ? "text-[10px] px-1.5 py-0.5 gap-1" 
    : "text-[11px] px-2.5 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-mono-data font-semibold uppercase tracking-wider ${sizeClasses} ${colorClasses}`}
    >
      {showIcon && icon}
      <span>{norm.replace(/_/g, " ")}</span>
    </span>
  );
}
