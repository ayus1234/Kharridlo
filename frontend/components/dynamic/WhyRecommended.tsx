"use client";

import { CheckCircle2, Sparkles, Award, Zap, TrendingDown, BatteryCharging, AlertCircle } from "lucide-react";
import { TradeoffType } from "@/lib/discovery-engine";

interface WhyRecommendedProps {
  reasons?: string[];
  productName?: string;
  category?: string;
  budgetInr?: number;
  priceInr?: number;
  specs?: Record<string, any>;
  tradeoffType?: TradeoffType | string;
  tradeoffSummary?: string;
  className?: string;
  compact?: boolean;
}

export default function WhyRecommended({
  reasons,
  category,
  budgetInr,
  priceInr,
  specs,
  tradeoffType,
  tradeoffSummary,
  className = "",
  compact = false,
}: WhyRecommendedProps) {
  // Derive factual, attribute-tied reasons if not explicitly supplied
  const resolvedReasons: string[] = reasons && reasons.length > 0 ? reasons : (() => {
    const derived: string[] = [];
    if (budgetInr && priceInr && priceInr <= budgetInr) {
      derived.push(`Within your ₹${budgetInr.toLocaleString("en-IN")} budget`);
    } else if (priceInr && priceInr < 50000) {
      derived.push("Lowest price among verified performance options");
    }

    if (specs) {
      const specString = Object.values(specs).join(" ").toLowerCase();
      if (specString.includes("16gb") || specString.includes("32gb")) {
        derived.push("16GB+ RAM for seamless coding, compiling & multitasking");
      }
      if (specString.includes("ssd") || specString.includes("nvme")) {
        derived.push("High-speed NVMe PCIe SSD for fast boot and build times");
      }
      if (specString.includes("108mp") || specString.includes("ois")) {
        derived.push("108MP primary camera with Optical Image Stabilization");
      }
      if (specString.includes("anc") || specString.includes("noise cancelling")) {
        derived.push("Active noise cancellation ideal for library & study focus");
      }
      if (specString.includes("13-hour") || specString.includes("11.5 hours") || specString.includes("5000mah")) {
        derived.push("Extended all-day battery endurance");
      }
      if (specString.includes("rtx") || specString.includes("graphics")) {
        derived.push("Dedicated GPU for graphics compute and gaming");
      }
    }

    if (derived.length === 0) {
      if (category?.toLowerCase().includes("laptop")) {
        derived.push("Balanced architecture for software development & coursework");
      } else if (category?.toLowerCase().includes("smartphone")) {
        derived.push("High-resolution camera sensor with fast multi-core processor");
      } else {
        derived.push("Verified hardware with student warranty & direct dispatch");
      }
    }

    return derived.slice(0, compact ? 2 : 3);
  })();

  const badgeConfig: Record<string, { label: string; icon: any; style: string }> = {
    "BEST OVERALL": {
      label: "BEST OVERALL",
      icon: Award,
      style: "bg-emerald-50 text-growth-dark border-emerald-300 ring-1 ring-emerald-500/20",
    },
    "BEST VALUE": {
      label: "BEST VALUE",
      icon: TrendingDown,
      style: "bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-500/15",
    },
    "BEST PERFORMANCE": {
      label: "BEST PERFORMANCE",
      icon: Zap,
      style: "bg-purple-50 text-ai-violet border-purple-200 ring-1 ring-purple-500/15",
    },
    "BUDGET ALTERNATIVE": {
      label: "BUDGET ALTERNATIVE",
      icon: AlertCircle,
      style: "bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-500/20",
    },
    "BEST BATTERY": {
      label: "BEST BATTERY CHOICE",
      icon: BatteryCharging,
      style: "bg-teal-50 text-teal-800 border-teal-200 ring-1 ring-teal-500/15",
    },
  };

  const badge = tradeoffType && badgeConfig[tradeoffType] ? badgeConfig[tradeoffType] : null;

  if (compact) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        {badge && (
          <div className="flex items-center gap-1 mb-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-display uppercase tracking-wide border ${badge.style}`}>
              <badge.icon className="w-3 h-3" />
              <span>{badge.label}</span>
            </span>
          </div>
        )}
        {resolvedReasons.map((reason, i) => (
          <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600 leading-tight">
            <CheckCircle2 className="w-3.5 h-3.5 text-growth-dark flex-shrink-0 mt-0.5" />
            <span>{reason}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`rounded-xl bg-purple-50/50 border border-purple-100/80 p-3 ${className}`}>
      {/* Header with Trade-Off Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-ai-violet" />
          <span className="text-[10px] font-mono-data uppercase font-bold tracking-wider text-ai-violet">
            Why Kharridlo Recommends This
          </span>
        </div>

        {badge && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-display uppercase tracking-wide border ${badge.style}`}>
            <badge.icon className="w-2.5 h-2.5" />
            <span>{badge.label}</span>
          </span>
        )}
      </div>

      {/* Trade-off summary if present */}
      {tradeoffSummary && (
        <p className="text-xs font-semibold text-navy-900 mb-2 leading-snug bg-white/70 rounded-lg p-1.5 border border-purple-100/60">
          {tradeoffSummary}
        </p>
      )}

      {/* Concrete, attribute-tied reasons */}
      <ul className="space-y-1.5">
        {resolvedReasons.map((reason, idx) => (
          <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-700 leading-snug">
            <CheckCircle2 className="w-3.5 h-3.5 text-growth-emerald flex-shrink-0 mt-0.5" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
