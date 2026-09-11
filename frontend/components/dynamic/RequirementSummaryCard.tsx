"use client";

import { useState } from "react";
import { Sliders, Sparkles, Check, Edit3, X } from "lucide-react";

export interface ShoppingRequirements {
  category?: string;
  budgetInr?: number;
  useCase?: string;
  priority?: string;
  constraints?: string[];
  brand?: string;
}

interface RequirementSummaryCardProps {
  requirements: ShoppingRequirements;
  onEdit?: () => void;
  onUpdateRequirement?: (updated: ShoppingRequirements) => void;
  className?: string;
  compact?: boolean;
}

/**
 * Utility helper to safely extract structured requirements from freeform queries
 * (e.g., "Laptops for CS & Coding under ₹60k", "find a 16gb laptop under 70000").
 */
export function parseRequirementsFromPrompt(query: string): ShoppingRequirements | null {
  if (!query || query.trim().length < 4) return null;
  const q = query.toLowerCase();

  let category: string | undefined = undefined;
  if (q.includes("laptop") || q.includes("notebook") || q.includes("macbook")) category = "Laptop";
  else if (q.includes("headphone") || q.includes("headset") || q.includes("earbuds") || q.includes("audio")) category = "Audio";
  else if (q.includes("monitor") || q.includes("display") || q.includes("screen")) category = "Monitor";
  else if (q.includes("keyboard") || q.includes("keychron")) category = "Keyboard";
  else if (q.includes("ssd") || q.includes("storage") || q.includes("nvme")) category = "Storage";

  let budgetInr: number | undefined = undefined;
  const budgetMatch = q.match(/(?:under|below|budget|within|<=|<|₹|rs\.?)\s*(?:₹|rs\.?)?\s*(\d{1,3}(?:,\d{2,3})*|\d+)\s*(k|thousand|lakh)?/i);
  if (budgetMatch) {
    const rawNum = parseFloat(budgetMatch[1].replace(/,/g, ""));
    const unit = budgetMatch[2]?.toLowerCase();
    if (unit === "k" || unit === "thousand") {
      budgetInr = rawNum * 1000;
    } else if (unit === "lakh") {
      budgetInr = rawNum * 100000;
    } else if (rawNum < 500) {
      // e.g. "under 70k" but without k
      budgetInr = rawNum * 1000;
    } else {
      budgetInr = rawNum;
    }
  }

  let useCase: string | undefined = undefined;
  if (q.includes("coding") || q.includes("programming") || q.includes("developer") || q.includes("cs") || q.includes("computer science") || q.includes("ai/ml") || q.includes("engineering")) {
    useCase = "Coding & Engineering";
  } else if (q.includes("study") || q.includes("college") || q.includes("student") || q.includes("school")) {
    useCase = "Academic & Study";
  } else if (q.includes("gaming") || q.includes("game")) {
    useCase = "Gaming & High Compute";
  } else if (q.includes("design") || q.includes("editing") || q.includes("video")) {
    useCase = "Design & Creative Work";
  }

  const constraints: string[] = [];
  if (q.includes("16gb") || q.includes("16 gb")) constraints.push("16GB RAM");
  if (q.includes("32gb") || q.includes("32 gb")) constraints.push("32GB RAM");
  if (q.includes("anc") || q.includes("noise cancel")) constraints.push("Active Noise Cancellation");
  if (q.includes("4k")) constraints.push("4K Resolution");
  if (q.includes("silent")) constraints.push("Silent Switches");
  if (q.includes("lightweight") || q.includes("portable")) constraints.push("Ultraportable");

  let priority: string | undefined = undefined;
  if (q.includes("budget") || q.includes("cheap") || q.includes("affordable") || q.includes("value")) {
    priority = "Maximum Value / Low Price";
  } else if (q.includes("performance") || q.includes("fast") || q.includes("speed")) {
    priority = "High Sustained Performance";
  } else if (q.includes("battery")) {
    priority = "All-day Battery Life";
  }

  if (!category && !budgetInr && !useCase && constraints.length === 0) {
    return null;
  }

  return {
    category: category || "Tech Gear",
    budgetInr,
    useCase: useCase || "General Student Productivity",
    priority: priority || "Academic Fit & Reliability",
    constraints: constraints.length > 0 ? constraints : ["Student Verified"],
  };
}

export default function RequirementSummaryCard({
  requirements,
  onEdit,
  onUpdateRequirement,
  className = "",
  compact = false,
}: RequirementSummaryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftBudget, setDraftBudget] = useState(requirements.budgetInr?.toString() || "");

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(draftBudget.replace(/\D/g, ""), 10);
    if (onUpdateRequirement && !isNaN(num) && num > 0) {
      onUpdateRequirement({
        ...requirements,
        budgetInr: num,
      });
    }
    setIsEditing(false);
  };

  if (compact) {
    return (
      <div className={`rounded-xl border border-indigo-100 bg-white p-3 shadow-xs ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-ai-violet" />
            <span className="text-[11px] font-mono-data uppercase font-bold tracking-wider text-navy-900">
              Active Shopping Intent
            </span>
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-[10px] font-semibold text-ai-violet hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-2.5 h-2.5" /> Edit
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {requirements.category && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
              {requirements.category}
            </span>
          )}
          {requirements.budgetInr && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-growth-dark font-mono-data font-bold border border-emerald-200">
              ≤ ₹{requirements.budgetInr.toLocaleString("en-IN")}
            </span>
          )}
          {requirements.useCase && (
            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-ai-violet font-medium border border-purple-200">
              {requirements.useCase}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 p-4 sm:p-5 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-indigo-100/70">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-ai-violet/10 border border-ai-violet/20 flex items-center justify-center text-ai-violet">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xs sm:text-sm text-navy-900 tracking-tight">
              Understanding Your Need
            </h3>
            <p className="text-[10px] text-slate-500 font-mono-data">
              Kharridlo Intent Engine • Real-time commerce constraints
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onEdit ? (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-ai-violet bg-white border border-purple-200 hover:bg-purple-50 active:scale-95 transition-all shadow-2xs"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit requirements</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-purple-300 hover:text-ai-violet active:scale-95 transition-all shadow-2xs"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isEditing ? "Close" : "Adjust"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Requirements Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
        {/* Category */}
        <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
          <span className="text-[10px] font-mono-data uppercase text-slate-400 font-semibold block">
            Category
          </span>
          <span className="text-xs sm:text-sm font-bold text-navy-900 block mt-0.5 truncate">
            {requirements.category || "All Hardware"}
          </span>
        </div>

        {/* Budget */}
        <div className="p-2.5 rounded-xl bg-white border border-emerald-200/80 shadow-2xs">
          <span className="text-[10px] font-mono-data uppercase text-emerald-600 font-semibold block">
            Target Budget
          </span>
          <span className="text-xs sm:text-sm font-bold text-growth-dark font-mono-data block mt-0.5">
            {requirements.budgetInr ? `₹${requirements.budgetInr.toLocaleString("en-IN")}` : "Flexible"}
          </span>
        </div>

        {/* Use Case */}
        <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
          <span className="text-[10px] font-mono-data uppercase text-slate-400 font-semibold block">
            Use Case
          </span>
          <span className="text-xs sm:text-sm font-bold text-navy-900 block mt-0.5 truncate">
            {requirements.useCase || "Student General"}
          </span>
        </div>

        {/* Priority */}
        <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
          <span className="text-[10px] font-mono-data uppercase text-slate-400 font-semibold block">
            Priority
          </span>
          <span className="text-xs sm:text-sm font-bold text-ai-violet block mt-0.5 truncate">
            {requirements.priority || "Hardware Value"}
          </span>
        </div>
      </div>

      {/* Constraints / Preference Tags */}
      {requirements.constraints && requirements.constraints.length > 0 && (
        <div className="mt-3 pt-3 border-t border-indigo-100/60 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono-data uppercase text-slate-400 font-semibold mr-1">
            Constraints:
          </span>
          {requirements.constraints.map((c, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs"
            >
              <Check className="w-2.5 h-2.5 text-growth-emerald" />
              <span>{c}</span>
            </span>
          ))}
        </div>
      )}

      {/* Inline Editing Form */}
      {isEditing && (
        <form onSubmit={handleSaveBudget} className="mt-3 pt-3 border-t border-indigo-100/80 flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Adjust Budget (₹):</span>
          <input
            type="number"
            value={draftBudget}
            onChange={(e) => setDraftBudget(e.target.value)}
            placeholder="e.g. 70000"
            className="w-32 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono-data text-navy-900 focus:outline-none focus:ring-2 focus:ring-ai-violet"
          />
          <button
            type="submit"
            className="px-3 py-1 rounded-lg bg-navy-900 text-white text-xs font-semibold hover:bg-ai-violet transition-colors"
          >
            Update
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
