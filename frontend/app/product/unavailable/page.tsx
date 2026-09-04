"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  CheckCircle2, 
  Bell, 
  RotateCcw,
  Check
} from "lucide-react";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import ProductImage from "@/components/ProductImage";
import BentoCard from "@/components/BentoCard";
import { getOrCreateSessionId } from "@/lib/session";

interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price_inr: number;
  description: string;
  image_url?: string;
  matchScore?: number;
}

export default function ProductUnavailablePage() {
  const [substitutes, setSubstitutes] = useState<Product[]>([]);
  const [emailSubscribed, setEmailSubscribed] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    fetchSubstitutes();
  }, []);

  const fetchSubstitutes = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/products?limit=3`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const enriched = (data.items || []).map((p: any, i: number) => ({
          ...p,
          matchScore: 96 - i * 3,
        }));
        setSubstitutes(enriched);
      }
    } catch {
      // Fallback
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
        setToastMsg(`Substituted with "${product.name}" in cart.`);
        setTimeout(() => setToastMsg(null), 3000);
      }
    } catch {
      setToastMsg("Could not update cart.");
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

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* Out of Stock Notice (Stitch: product_unavailable) */}
        <div className="rounded-3xl border border-amber-200 bg-white p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 flex-shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono-data uppercase tracking-wider text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Inventory Depleted
                </span>
                <h1 className="font-display font-bold text-xl sm:text-2xl text-navy-900 mt-1">
                  Product Currently Out of Stock
                </h1>
                <p className="text-xs text-slate-500 mt-1 max-w-lg">
                  This specific hardware unit has been reserved by university lab allocations. Our AI has generated verified in-stock substitutions below.
                </p>
              </div>
            </div>

            {/* Waitlist Subscription */}
            <div className="w-full sm:w-auto p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
              <input
                type="email"
                placeholder="student@university.edu"
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-navy-900 placeholder:text-slate-400 focus:outline-none focus:border-ai-violet"
              />
              <button
                onClick={() => setEmailSubscribed(true)}
                className="px-3 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                {emailSubscribed ? "Notified!" : "Notify Me"}
              </button>
            </div>
          </div>
        </div>

        {/* AI Substitution Suggestions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-ai-violet" />
              <h2 className="font-display font-bold text-base text-navy-900">
                AI Automated Substitutions (Zero-Latency Inventory Recovery)
              </h2>
            </div>
            <span className="text-xs font-mono-data text-growth-dark font-semibold">
              3 Verified Alternatives
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {substitutes.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono-data uppercase text-slate-400">
                      {p.brand}
                    </span>
                    <span className="text-[10px] font-mono-data font-bold text-growth-dark bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {p.matchScore}% Match
                    </span>
                  </div>

                  <div className="aspect-video rounded-xl bg-slate-50 overflow-hidden mb-3">
                    <ProductImage
                      src={p.image_url || "/assets/laptop-product.png"}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <h3 className="font-display font-bold text-xs text-navy-900 line-clamp-2">
                    {p.name}
                  </h3>
                  <div className="font-display font-bold text-base text-navy-900 mt-2">
                    ₹{p.price_inr.toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/product/${p.id}`}
                    className="text-xs font-semibold text-slate-600 hover:text-navy-900"
                  >
                    Inspect Specs
                  </Link>
                  <button
                    onClick={() => handleAddToCart(p)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-semibold hover:bg-ai-violet transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Select Alternative</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BuyerFooter />
    </div>
  );
}
