"use client";

import { CheckCircle2, Sparkles } from "lucide-react";

interface WhyRecommendedProps {
  reasons?: string[];
  productName?: string;
  category?: string;
  budgetInr?: number;
  priceInr?: number;
  specs?: Record<string, any>;
  className?: string;
  compact?: boolean;
}

export default function WhyRecommended({
  reasons,
  category,
  budgetInr,
  priceInr,
  specs,
  className = "",
  compact = false,
}: WhyRecommendedProps) {
  // Derive safe, user-facing reasons if not explicitly supplied
  const resolvedReasons: string[] = reasons && reasons.length > 0 ? reasons : (() => {
    const derived: string[] = [];
    if (budgetInr && priceInr && priceInr <= budgetInr) {
      derived.push(`Within your ₹${budgetInr.toLocaleString("en-IN")} budget`);
    } else if (priceInr && priceInr < 50000) {
      derived.push("Budget-optimized for student academic workflows");
    }

    if (specs) {
      const specString = Object.values(specs).join(" ").toLowerCase();
      if (specString.includes("16gb") || specString.includes("32gb")) {
        derived.push("16GB+ RAM for seamless coding & compiling");
      }
      if (specString.includes("ssd") || specString.includes("nvme")) {
        derived.push("High-speed NVMe SSD for fast boot & build times");
      }
      if (specString.includes("anc") || specString.includes("noise cancelling")) {
        derived.push("Active noise cancellation ideal for library & study focus");
      }
      if (specString.includes("4k") || specString.includes("ips") || specString.includes("144hz")) {
        derived.push("High-clarity display suited for long coding sessions");
      }
    }

    if (derived.length === 0) {
      if (category?.toLowerCase().includes("laptop")) {
        derived.push("Balanced performance for software development & coursework");
      } else if (category?.toLowerCase().includes("audio") || category?.toLowerCase().includes("headphone")) {
        derived.push("Comfortable acoustic design for focused study hours");
      } else {
        derived.push("Verified hardware with student warranty & direct dispatch");
      }
      derived.push("Verified in-stock with express student delivery");
    }

    return derived.slice(0, compact ? 2 : 3);
  })();

  if (compact) {
    return (
      <div className={`space-y-1 ${className}`}>
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
    <div className={`rounded-xl bg-purple-50/50 border border-purple-100/80 p-2.5 ${className}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Sparkles className="w-3 h-3 text-ai-violet" />
        <span className="text-[10px] font-mono-data uppercase font-bold tracking-wider text-ai-violet">
          Why Kharridlo Recommends This
        </span>
      </div>
      <ul className="space-y-1">
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
