"use client";

import DynamicProductCard, { DynamicProduct } from "@/components/dynamic/DynamicProductCard";

interface ProductRecommendationGridProps {
  products: DynamicProduct[];
  loading?: boolean;
  userBudgetInr?: number;
  onAddToCart?: (product: DynamicProduct) => void;
  className?: string;
  columns?: 2 | 3 | 4;
}

export default function ProductRecommendationGrid({
  products,
  loading = false,
  userBudgetInr,
  onAddToCart,
  className = "",
  columns = 3,
}: ProductRecommendationGridProps) {
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
        <p className="text-sm font-semibold text-slate-700">No matching products found</p>
        <p className="text-xs text-slate-500 mt-1">
          Try broadening your search criteria or adjusting your budget filter.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid ${colClass} gap-5 sm:gap-6 ${className}`}>
      {products.map((product, idx) => (
        <DynamicProductCard
          key={product.id}
          product={product}
          priorityImage={idx < 2}
          userBudgetInr={userBudgetInr}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
