"use client";

import { useState } from "react";
import { Sliders, Check, Edit3, X, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { ShoppingRequirements, extractRequirements } from "@/lib/discovery-engine";

export type { ShoppingRequirements };

export function parseRequirementsFromPrompt(query: string): ShoppingRequirements | null {
  return extractRequirements(query);
}

interface RequirementSummaryCardProps {
  requirements: ShoppingRequirements;
  onEdit?: () => void;
  onUpdateRequirement?: (updated: ShoppingRequirements) => void;
  onQuickCorrection?: (actionPrompt: string) => void;
  className?: string;
  compact?: boolean;
}

export default function RequirementSummaryCard({
  requirements,
  onEdit,
  onUpdateRequirement,
  onQuickCorrection,
  className = "",
  compact = false,
}: RequirementSummaryCardProps) {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [draftBudget, setDraftBudget] = useState(requirements.budgetInr?.toString() || "");

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(draftBudget.replace(/\D/g, ""), 10);
    if (!isNaN(num) && num > 0) {
      if (onUpdateRequirement) {
        onUpdateRequirement({
          ...requirements,
          budgetInr: num,
          budgetPaise: num * 100,
        });
      } else if (onQuickCorrection) {
        onQuickCorrection(`Change my budget to ₹${num.toLocaleString("en-IN")}`);
      }
    }
    setIsEditingBudget(false);
  };

  const handleChipClick = (actionPrompt: string) => {
    if (onQuickCorrection) {
      onQuickCorrection(actionPrompt);
    } else if (onUpdateRequirement) {
      if (actionPrompt === "Show cheaper options") {
        onUpdateRequirement({ ...requirements, priority: "Value" });
      } else if (actionPrompt === "Prioritize battery") {
        onUpdateRequirement({ ...requirements, priority: "Battery" });
      } else if (actionPrompt === "Remove gaming") {
        const filteredUseCases = (requirements.useCases || []).filter((u) => !u.toLowerCase().includes("gaming"));
        onUpdateRequirement({ ...requirements, useCases: filteredUseCases });
      }
    }
  };

  // Compact Mode (used in chat bubbles or mobile context rails)
  if (compact) {
    return (
      <div className={`rounded-xl border border-indigo-100 bg-white/95 backdrop-blur-xs p-3 shadow-2xs ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-ai-violet" />
            <span className="text-[11px] font-mono-data uppercase font-bold tracking-wider text-navy-900">
              Here&apos;s what I understood
            </span>
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-[10px] font-semibold text-ai-violet hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-2.5 h-2.5" /> Adjust
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {requirements.category && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700 capitalize">
              {requirements.category}
            </span>
          )}
          {requirements.budgetInr && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-growth-dark font-mono-data font-bold border border-emerald-200">
              ≤ ₹{requirements.budgetInr.toLocaleString("en-IN")}
            </span>
          )}
          {requirements.useCases && requirements.useCases.length > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-ai-violet font-medium border border-purple-200 truncate max-w-[180px]">
              {requirements.useCases.join(" + ")}
            </span>
          )}
          {requirements.priority && (
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium border border-indigo-200">
              {requirements.priority}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Full Rich Mode with Quick Correction Chips
  const useCaseText = requirements.useCases && requirements.useCases.length > 0
    ? requirements.useCases.join(" + ")
    : "General Productivity";

  const preferencesText = [
    ...(requirements.preferredSpecs || []),
    ...(requirements.mustHave || []),
  ].filter(Boolean).join(", ") || "Standard verified hardware";

  const hasGaming = requirements.useCases?.some((u) => u.toLowerCase().includes("gaming"));

  return (
    <div className={`rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 p-4 sm:p-5 shadow-xs ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-indigo-100/70">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-ai-violet/10 border border-ai-violet/20 flex items-center justify-center text-ai-violet">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xs sm:text-sm text-navy-900 tracking-tight">
              Here&apos;s what I understood
            </h3>
            <p className="text-[10px] text-slate-500 font-mono-data">
              Kharridlo Natural-Language Requirement Engine • Session isolated
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsEditingBudget(!isEditingBudget)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-purple-300 hover:text-ai-violet active:scale-95 transition-all shadow-2xs"
          >
            <Edit3 className="w-3 h-3" />
            <span>{isEditingBudget ? "Cancel" : "Change budget"}</span>
          </button>
        </div>
      </div>

      {/* Structured Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
        {/* Budget */}
        <div className="p-2.5 rounded-xl bg-white border border-emerald-200/80 shadow-2xs">
          <span className="text-[10px] font-mono-data uppercase text-emerald-600 font-semibold block">
            Budget
          </span>
          <span className="text-xs sm:text-sm font-bold text-growth-dark font-mono-data block mt-0.5">
            {requirements.budgetInr ? `₹${requirements.budgetInr.toLocaleString("en-IN")}` : "Flexible"}
          </span>
        </div>

        {/* Use Cases */}
        <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
          <span className="text-[10px] font-mono-data uppercase text-slate-400 font-semibold block">
            Use
          </span>
          <span className="text-xs sm:text-sm font-bold text-navy-900 block mt-0.5 truncate" title={useCaseText}>
            {useCaseText}
          </span>
        </div>

        {/* Priority */}
        <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
          <span className="text-[10px] font-mono-data uppercase text-slate-400 font-semibold block">
            Priority
          </span>
          <span className="text-xs sm:text-sm font-bold text-ai-violet block mt-0.5 truncate">
            {requirements.priority || "Balanced"}
          </span>
        </div>

        {/* Preferences */}
        <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
          <span className="text-[10px] font-mono-data uppercase text-slate-400 font-semibold block">
            Preferences
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-700 block mt-0.5 truncate" title={preferencesText}>
            {preferencesText}
          </span>
        </div>
      </div>

      {/* Exclusions Banner if active */}
      {requirements.exclusions && requirements.exclusions.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
          <span className="text-[10px] font-mono-data uppercase text-rose-500 font-bold mr-1">
            Excluded:
          </span>
          {requirements.exclusions.map((excl, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"
            >
              <X className="w-2.5 h-2.5" />
              <span>{excl}</span>
            </span>
          ))}
        </div>
      )}

      {/* Inline Budget Editor */}
      {isEditingBudget && (
        <form onSubmit={handleSaveBudget} className="mt-3 pt-3 border-t border-indigo-100/80 flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Target Budget (₹):</span>
          <input
            type="number"
            value={draftBudget}
            onChange={(e) => setDraftBudget(e.target.value)}
            placeholder="e.g. 80000"
            className="w-32 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono-data text-navy-900 focus:outline-none focus:ring-2 focus:ring-ai-violet"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1 rounded-lg bg-navy-900 text-white text-xs font-semibold hover:bg-ai-violet transition-colors"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => setIsEditingBudget(false)}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Clear Way to Correct: Quick Correction Chips */}
      <div className="mt-3 pt-2.5 border-t border-indigo-100/60 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-mono-data uppercase text-slate-400 font-semibold mr-1">
          Quick Adjust:
        </span>

        <button
          type="button"
          onClick={() => setIsEditingBudget(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-ai-violet hover:bg-indigo-50/40 transition-colors shadow-2xs"
        >
          <span>Change budget</span>
        </button>

        <button
          type="button"
          onClick={() => handleChipClick("Prioritize battery")}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-ai-violet hover:bg-indigo-50/40 transition-colors shadow-2xs"
        >
          <span>Prioritize battery</span>
        </button>

        {hasGaming && (
          <button
            type="button"
            onClick={() => handleChipClick("Remove gaming")}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white border border-slate-200 text-slate-700 hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50/40 transition-colors shadow-2xs"
          >
            <X className="w-2.5 h-2.5" />
            <span>Remove gaming</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => handleChipClick("Show cheaper options")}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white border border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-growth-dark hover:bg-emerald-50/40 transition-colors shadow-2xs"
        >
          <span>Show cheaper options</span>
        </button>
      </div>
    </div>
  );
}
