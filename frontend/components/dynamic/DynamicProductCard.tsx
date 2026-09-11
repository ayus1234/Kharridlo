"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  CheckCircle2, 
  GitCompare, 
  ShoppingBag, 
  ArrowRight, 
  Check, 
  Cpu, 
  HardDrive, 
  Monitor, 
  ShieldCheck,
  Plus
} from "lucide-react";
import ProductImage from "@/components/ProductImage";
import WhyRecommended from "@/components/dynamic/WhyRecommended";
import { getOrCreateSessionId } from "@/lib/session";

export type MatchTier = "Strong Match" | "Good Match" | "Alternative";

export interface DynamicProduct {
  id: string;
  sku?: string;
  name: string;
  brand: string;
  category: string;
  price_inr: number;
  mrp_inr?: number;
  price_paise?: number;
  description?: string;
  image_url?: string;
  specs?: Record<string, any>;
  matchBadge?: MatchTier;
  matchScore?: number;
  whyRecommended?: string[];
  inStock?: boolean;
}

interface DynamicProductCardProps {
  product: DynamicProduct;
  priorityImage?: boolean;
  userBudgetInr?: number;
  onAddToCart?: (product: DynamicProduct) => void;
  className?: string;
}

/**
 * Derives a qualitative match indicator badge without fake precision decimals.
 */
export function getQualitativeMatchTier(
  product: DynamicProduct, 
  userBudgetInr?: number
): MatchTier {
  if (product.matchBadge) return product.matchBadge;

  const price = product.price_inr;
  const hardware = Object.values(product.specs || {}).join(" ").toLowerCase();

  // If within budget and has strong specs
  if (userBudgetInr && price <= userBudgetInr) {
    if (hardware.includes("16gb") || hardware.includes("ryzen") || hardware.includes("i7") || hardware.includes("core ultra")) {
      return "Strong Match";
    }
    return "Good Match";
  }

  if (price < 60000) {
    return "Good Match";
  }

  return "Alternative";
}

export default function DynamicProductCard({
  product,
  priorityImage = false,
  userBudgetInr,
  onAddToCart,
  className = "",
}: DynamicProductCardProps) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const matchTier = getQualitativeMatchTier(product, userBudgetInr);

  const badgeStyles = {
    "Strong Match": "bg-emerald-50 text-growth-dark border-emerald-300 ring-1 ring-emerald-500/20",
    "Good Match": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Alternative": "bg-amber-50 text-amber-800 border-amber-200",
  }[matchTier];

  const handleAddClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (adding) return;
    setAdding(true);

    try {
      if (onAddToCart) {
        await onAddToCart(product);
      } else {
        const sid = getOrCreateSessionId();
        const res = await fetch(`/api/cart/${sid}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: product.id,
            quantity: 1,
            title: product.name,
            price_paise: product.price_paise || Math.round(product.price_inr * 100),
            brand: product.brand,
            category: product.category,
            image_url: product.image_url,
          }),
        });
        if (res.ok) {
          window.dispatchEvent(new Event("cart-updated"));
        }
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch {
      // Graceful fallback
    } finally {
      setAdding(false);
    }
  };

  // Extract key specs for quick chips
  const specs = product.specs || {};
  const processor = specs.processor || specs.cpu || specs.processor_type;
  const memory = specs.memory || specs.ram;
  const storage = specs.storage || specs.storage_capacity;

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 hover:-translate-y-1 transition-all duration-200 ease-out ${className}`}
    >
      {/* Top Meta: Category & Qualitative Match Indicator */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[10px] font-mono-data font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
          {product.category}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-display uppercase tracking-wide border ${badgeStyles}`}
          >
            <Sparkles className="w-2.5 h-2.5" />
            {matchTier}
          </span>
        </div>
      </div>

      {/* Image Preview with Aspect-Ratio Protection */}
      <Link
        href={`/product/${product.id}`}
        className="block overflow-hidden rounded-xl bg-slate-50 mb-3.5 aspect-[4/3] relative"
      >
        <ProductImage
          src={product.image_url}
          alt={product.name}
          category={product.category}
          productId={product.id}
          priority={priorityImage}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-navy-900/85 backdrop-blur-xs text-white px-2 py-0.5 rounded-full shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-growth-light" />
            Student Verified
          </span>
        </div>
      </Link>

      {/* Product Information */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 font-mono-data">
              {product.brand}
            </span>
            <span className="text-[10px] font-mono-data font-semibold text-growth-dark bg-emerald-50 px-2 py-0.5 rounded-md">
              In Stock
            </span>
          </div>

          <h3 className="font-display font-bold text-sm text-navy-900 line-clamp-1 mt-0.5 group-hover:text-ai-violet transition-colors">
            <Link href={`/product/${product.id}`}>{product.name}</Link>
          </h3>

          {/* Quick Hardware Spec Pills */}
          {(processor || memory || storage) && (
            <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px] font-mono-data text-slate-600">
              {processor && (
                <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/60 truncate max-w-[140px]">
                  {String(processor)}
                </span>
              )}
              {memory && (
                <span className="px-1.5 py-0.5 rounded bg-purple-50 text-ai-violet border border-purple-200/60">
                  {String(memory)}
                </span>
              )}
              {storage && (
                <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/60">
                  {String(storage)}
                </span>
              )}
            </div>
          )}

          {/* Why Kharridlo Recommends This Component */}
          <div className="mt-3">
            <WhyRecommended
              reasons={product.whyRecommended}
              category={product.category}
              budgetInr={userBudgetInr}
              priceInr={product.price_inr}
              specs={product.specs}
              compact
            />
          </div>
        </div>

        {/* Pricing and Direct Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-[10px] text-slate-400 block font-mono-data uppercase">
                Student Price
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display font-bold text-base sm:text-lg text-navy-900">
                  ₹{product.price_inr.toLocaleString("en-IN")}
                </span>
                {product.mrp_inr && product.mrp_inr > product.price_inr && (
                  <span className="text-xs text-slate-400 line-through">
                    ₹{product.mrp_inr.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                href={`/compare?ids=${encodeURIComponent(product.id)}`}
                className="p-2 rounded-lg text-slate-500 hover:text-ai-violet hover:bg-purple-50 transition-colors border border-slate-200"
                title="Compare specs with other options"
              >
                <GitCompare className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAddClick}
              disabled={adding}
              className={`flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-bold font-display transition-all ${
                added
                  ? "bg-growth-emerald text-white"
                  : "bg-navy-900 text-white hover:bg-ai-violet active:scale-95 shadow-2xs"
              }`}
            >
              {added ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added!</span>
                </>
              ) : adding ? (
                <span>Adding...</span>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            <Link
              href={`/product/${product.id}`}
              className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl border border-slate-200 bg-white text-navy-900 text-xs font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all text-center"
            >
              <span>View Specs</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
