"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiMetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendPositive?: boolean;
  subtext?: string;
  icon?: React.ComponentType<{ className?: string }>;
  isSimulated?: boolean;
}

export default function KpiMetricCard({
  title,
  value,
  trend,
  trendPositive = true,
  subtext,
  icon: Icon,
  isSimulated = true,
}: KpiMetricCardProps) {
  return (
    <div className="relative rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Simulation Watermark Badge */}
      {isSimulated && (
        <span className="absolute top-2.5 right-3 text-[9px] font-mono-data font-medium text-slate-400 uppercase tracking-wider">
          Simulated
        </span>
      )}

      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-display">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-navy-900">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* KPI Value */}
      <div className="flex items-baseline gap-2">
        <span className="font-display text-2xl lg:text-3xl font-bold tracking-tight text-navy-900">
          {value}
        </span>
      </div>

      {/* Trend & Subtext */}
      <div className="flex items-center gap-2 mt-2">
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold font-mono-data ${
              trendPositive
                ? "bg-emerald-50 text-growth-dark border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {trendPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend}
          </span>
        )}
        {subtext && <span className="text-[11px] text-slate-500">{subtext}</span>}
      </div>
    </div>
  );
}
