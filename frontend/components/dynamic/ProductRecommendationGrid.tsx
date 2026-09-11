"use client";

import { useState } from "react";
import { Sparkles, AlertCircle, Award, TrendingDown, Zap, Filter } from "lucide-react";
import DynamicProductCard, { DynamicProduct } from "@/components/dynamic/DynamicProductCard";

interface ProductRecommendationGridProps {
  products: DynamicProduct[];
  loading?: boolean;
  userBudgetInr?: number;
  budgetGapNotice?: string | null;
  onAddToCart?: (product: DynamicProduct) => void;
  className?: string;
  columns?: 2 | 3 | 4;
}

export default function ProductRecommendationGrid({
  products,
  loading = false,
  userBudgetInr,
  budgetGapNotice,
  onAddToCart,
  className = "",
  columns = 3,
}: ProductRecommendationGridProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");

  const colClass = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  if (loading) {
    return (
      <div className={`grid ${colClass} gap-5 sm:gap-6 ${className}`}>
        {Array.from({ length: columns * 2 }).map((_, i) => (
          <div
            key={i}
            className="h-96 rounded-2xl bg-slate-100/80 animate-pulse border border-slate-200"
          />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12 rounded-2xl border border-slate-200 bg-white p-8">
        <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-3 text-amber-700">
          <AlertCircle className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold text-navy-900">No matching products found</p>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          {budgetGapNotice || "We couldn't find hardware matching those exact criteria. Try relaxing your budget cap or clearing exclusions."}
        </p>
      </div>
    );
  }

  // Detect which tradeoff groups are actively present in the result set
  const hasBestOverall = products.some((p) => p.tradeoffType === "BEST OVERALL");
  const hasBestValue = products.some((p) => p.tradeoffType === "BEST VALUE");
  const hasBestPerformance = products.some((p) => p.tradeoffType === "BEST PERFORMANCE");
  const hasBudgetAlternative = products.some((p) => p.tradeoffType === "BUDGET ALTERNATIVE");

  // Filter products by selected group if not ALL
  const filteredProducts = products.filter((p) => {
    if (selectedGroup === "ALL") return true;
    if (selectedGroup === "OVERALL") return p.tradeoffType === "BEST OVERALL";
    if (selectedGroup === "VALUE") return p.tradeoffType === "BEST VALUE";
    if (selectedGroup === "PERFORMANCE") return p.tradeoffType === "BEST PERFORMANCE";
    if (selectedGroup === "ALTERNATIVE") return p.tradeoffType === "BUDGET ALTERNATIVE";
    return true;
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Budget Gap Notice if relevant */}
      {budgetGapNotice && (
        <div className="rounded-xl bg-amber-50 border border-amber-200/90 p-3.5 flex items-start gap-2.5 text-amber-900 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold block mb-0.5">Budget Constraint Notice:</span>
            <span className="text-amber-800 leading-relaxed">{budgetGapNotice}</span>
          </div>
        </div>
      )}

      {/* Dynamic Recommendation Group Filters (rendered only when meaningful groups exist) */}
      {(hasBestOverall || hasBestValue || hasBestPerformance || hasBudgetAlternative) && products.length > 2 && (
        <div className="flex flex-wrap items-center gap-1.5 pb-1">
          <button
            type="button"
            onClick={() => setSelectedGroup("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedGroup === "ALL"
                ? "bg-navy-900 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            All Recommendations ({products.length})
          </button>

          {hasBestOverall && (
            <button
              type="button"
              onClick={() => setSelectedGroup("OVERALL")}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedGroup === "OVERALL"
                  ? "bg-growth-dark text-white shadow-xs"
                  : "bg-emerald-50/80 border border-emerald-200 text-growth-dark hover:bg-emerald-100/50"
              }`}
            >
              <Award className="w-3 h-3" />
              <span>Best Overall</span>
            </button>
          )}

          {hasBestValue && (
            <button
              type="button"
              onClick={() => setSelectedGroup("VALUE")}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedGroup === "VALUE"
                  ? "bg-indigo-700 text-white shadow-xs"
                  : "bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100/50"
              }`}
            >
              <TrendingDown className="w-3 h-3" />
              <span>Best Value</span>
            </button>
          )}

          {hasBestPerformance && (
            <button
              type="button"
              onClick={() => setSelectedGroup("PERFORMANCE")}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedGroup === "PERFORMANCE"
                  ? "bg-ai-violet text-white shadow-xs"
                  : "bg-purple-50 border border-purple-200 text-ai-violet hover:bg-purple-100/50"
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>Best Performance</span>
            </button>
          )}

          {hasBudgetAlternative && (
            <button
              type="button"
              onClick={() => setSelectedGroup("ALTERNATIVE")}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedGroup === "ALTERNATIVE"
                  ? "bg-amber-700 text-white shadow-xs"
                  : "bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100/50"
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>Budget Alternative</span>
            </button>
          )}
        </div>
      )}

      {/* Product Cards Grid */}
      <div className={`grid ${colClass} gap-5 sm:gap-6`}>
        {filteredProducts.map((product, idx) => (
          <DynamicProductCard
            key={product.id}
            product={product}
            priorityImage={idx < 2}
            userBudgetInr={userBudgetInr}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
}
