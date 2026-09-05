"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface BentoCardProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeType?: "ai" | "emerald" | "neutral" | "warning";
  aiInsight?: boolean;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function BentoCard({
  title,
  subtitle,
  badge,
  badgeType = "neutral",
  aiInsight = false,
  headerAction,
  children,
  className = "",
}: BentoCardProps) {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case "ai":
        return "bg-purple-50 text-ai-violet border-purple-200";
      case "emerald":
        return "bg-emerald-50 text-growth-dark border-emerald-200";
      case "warning":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div
      className={`relative rounded-2xl border bg-white p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300/30 ${
        aiInsight
          ? "border-purple-300 shadow-md shadow-purple-500/5 ring-1 ring-purple-100 hover:border-purple-400 hover:shadow-purple-500/15"
          : "border-slate-200/90 shadow-sm hover:border-slate-300"
      } ${className}`}
    >
      {/* Top AI Indicator Accent */}
      {aiInsight && (
        <div className="absolute -top-2.5 right-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-ai-violet to-growth-emerald px-2.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
          <Sparkles className="h-2.5 w-2.5" />
          <span>AI Insight</span>
        </div>
      )}

      {/* Header Slot */}
      {(title || subtitle || badge || headerAction) && (
        <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              {title && (
                <h3 className="font-display font-bold text-sm text-navy-900 tracking-tight">
                  {title}
                </h3>
              )}
              {badge && (
                <span
                  className={`text-[10px] font-mono-data font-semibold uppercase px-2 py-0.5 rounded-full border ${getBadgeStyle()}`}
                >
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
        </div>
      )}

      {/* Content Slot */}
      <div>{children}</div>
    </div>
  );
}
