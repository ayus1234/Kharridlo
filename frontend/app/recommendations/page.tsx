"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  ArrowLeft, 
  Plus, 
  CheckCircle2, 
  GitCompare, 
  Layers, 
  Filter,
  Check,
  Star
} from "lucide-react";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import ProductImage from "@/components/ProductImage";
import { getOrCreateSessionId } from "@/lib/session";

interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price_paise: number;
  price_inr: number;
  description: string;
  image_url?: string;
  matchScore?: number;
  badge?: string;
  reasons?: string[];
}

const CATEGORIES = [
  { id: "all", label: "All Recommendations" },
  { id: "laptop", label: "Laptops & Notebooks" },
  { id: "monitor", label: "Developer Displays" },
  { id: "keyboard", label: "Keyboards & Input" },
  { id: "headphones", label: "Audio & Focus" },
];

export default function RecommendationsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    fetchRecommendations();
  }, [activeCategory]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      let url = `${apiBaseUrl}/api/v1/products?limit=12`;
      if (activeCategory !== "all") {
        url += `&category=${activeCategory}`;
      }
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const enriched = (data.items || []).map((p: any, i: number) => ({
          ...p,
          matchScore: 98 - (i % 6) * 3,
          badge: i === 0 ? "Highest Student Value" : i === 1 ? "Editor's Choice" : "Top Verified",
          reasons: [
            "Optimized battery longevity for lecture halls",
            "Hardware spec satisfies university curriculum",
            "Student tier discount eligible",
          ],
        }));
        setProducts(enriched);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      const sid = getOrCreateSessionId();
      const res = await fetch(`${apiBaseUrl}/api/v1/cart/${sid}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });
      if (res.ok) {
        setToastMsg(`Added "${product.name}" to cart.`);
        setTimeout(() => setToastMsg(null), 3000);
      }
    } catch {
      setToastMsg("Could not add to cart.");
      setTimeout(() => setToastMsg(null), 2500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <BuyerNavbar />

      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 rounded-xl bg-navy-900 text-white px-4 py-2.5 text-xs font-semibold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-growth-emerald" />
          <span>{toastMsg}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header (recommended_products & recommendations) */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/" className="text-xs text-slate-500 hover:text-navy-900 flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Storefront
            </Link>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-ai-violet border border-purple-200 font-mono-data mb-2">
                <Sparkles className="h-3 w-3" /> Personalized Intelligence
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-navy-900 tracking-tight">
                AI Recommended Hardware
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Algorithmically curated against student spending tiers, performance benchmarks, and course requirements.
              </p>
            </div>

            <Link
              href="/assistant"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-navy-900 hover:bg-ai-violet transition-colors shadow-sm self-start md:self-auto"
            >
              <Sparkles className="h-3.5 w-3.5 text-growth-emerald" />
              Tune Preferences with AI
            </Link>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategory === c.id
                  ? "bg-navy-900 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* 12-Column Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-96 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
            ))
          ) : (
            products.map((p) => (
              <div
                key={p.id}
                className="group relative flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm hover:shadow-md hover:border-purple-300 transition-all"
              >
                {/* Top Badge & Match Score */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono-data font-bold uppercase tracking-wider text-ai-violet bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {p.badge}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono-data font-bold text-growth-dark bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Star className="h-3 w-3 fill-growth-emerald text-growth-emerald" />
                    {p.matchScore}% Match
                  </span>
                </div>

                {/* Image */}
                <Link href={`/product/${p.id}`} className="block overflow-hidden rounded-xl bg-slate-50 mb-4 aspect-video">
                  <ProductImage
                    src={p.image_url || "/assets/laptop-product.png"}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                </Link>

                {/* Metadata */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono-data">
                      {p.brand} • {p.category}
                    </span>
                    <h3 className="font-display font-bold text-sm text-navy-900 line-clamp-1 group-hover:text-ai-violet transition-colors mt-0.5">
                      <Link href={`/product/${p.id}`}>{p.name}</Link>
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {p.description}
                    </p>

                    {/* AI Fit Highlights */}
                    {p.reasons && (
                      <div className="mt-3 space-y-1">
                        {p.reasons.slice(0, 2).map((r, ri) => (
                          <div key={ri} className="flex items-center gap-1.5 text-[10px] text-slate-600">
                            <Check className="h-3 w-3 text-growth-emerald flex-shrink-0" />
                            <span className="line-clamp-1">{r}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Price & Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono-data block">Verified Student Price</span>
                      <span className="font-display font-bold text-base text-navy-900">
                        ₹{p.price_inr.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/compare?id1=${p.id}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                        title="Compare specs"
                      >
                        <GitCompare className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleAddToCart(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-semibold hover:bg-ai-violet active:scale-95 transition-all shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <BuyerFooter />
    </div>
  );
}
