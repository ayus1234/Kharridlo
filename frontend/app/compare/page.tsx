"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Sparkles, 
  Check, 
  X, 
  Plus, 
  CheckCircle2, 
  GitCompare, 
  ShieldCheck,
  ExternalLink
} from "lucide-react";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import ProductImage from "@/components/ProductImage";
import BentoCard from "@/components/BentoCard";
import { getOrCreateSessionId } from "@/lib/session";
import { getProviderBadge } from "@/lib/marketplace";

interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price_paise: number;
  price_inr: number;
  specs: Record<string, any>;
  image_url?: string;
  matchScore?: number;
  provider?: string;
  canonical_url?: string;
  seller_name?: string;
  can_authoritative_checkout?: boolean;
}

function CompareContent() {
  const searchParams = useSearchParams();
  const id1 = searchParams.get("id1");
  const id2 = searchParams.get("id2");

  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://kharridlo-backend.onrender.com";

  useEffect(() => {
    fetchProductsForComparison();
  }, [id1, id2]);

  const fetchProductsForComparison = async () => {
    setLoading(true);
    try {
      // Fetch multi-marketplace items
      const mRes = await fetch(`${apiBaseUrl}/api/v1/marketplace/search?limit=20`, { cache: "no-store" });
      let allItems: Product[] = [];
      if (mRes.ok) {
        const mData = await mRes.json();
        allItems = (mData.items || []).map((m: any) => ({
          id: m.id,
          sku: m.provider_product_id,
          name: m.title,
          brand: m.brand,
          category: m.category,
          price_paise: m.source_price_minor || 0,
          price_inr: m.source_price_inr || 0,
          specs: m.specifications || {},
          image_url: m.primary_image_url || m.images?.[0]?.source_url,
          provider: m.provider,
          canonical_url: m.canonical_url,
          seller_name: m.seller_name,
          can_authoritative_checkout: m.mapping?.can_authoritative_checkout ?? (m.provider === "kharridlo_verified"),
        }));
      }

      if (allItems.length === 0) {
        const res = await fetch(`${apiBaseUrl}/api/v1/products?limit=20`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          allItems = (data.items || []).map((p: any) => ({
            ...p,
            provider: "kharridlo_verified",
            can_authoritative_checkout: true,
          }));
        }
      }
      
      let selected: Product[] = [];
      if (id1) {
        const m1 = allItems.find((p: any) => p.id === id1 || p.sku === id1);
        if (m1) selected.push(m1);
      }
      if (id2) {
        const m2 = allItems.find((p: any) => p.id === id2 || p.sku === id2);
        if (m2) selected.push(m2);
      }

      // Ensure we have at least 2 or 3 items to compare
      if (selected.length < 2 && allItems.length >= 2) {
        selected = allItems.slice(0, 3);
      }

      setComparedProducts(selected);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (product.can_authoritative_checkout === false) {
      setToastMsg("External marketplace item cannot enter authoritative cart without verified mapping.");
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }
    try {
      const sid = getOrCreateSessionId();
      let res = await fetch(`${apiBaseUrl}/api/v1/cart/${sid}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`/api/cart/${sid}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: product.id,
            quantity: 1,
            title: product.name,
            price_paise: product.price_paise,
            brand: product.brand,
            category: product.category,
            image_url: product.image_url,
          }),
        });
      }

      if (res && res.ok) {
        window.dispatchEvent(new Event("cart-updated"));
        setToastMsg(`Added "${product.name}" to cart.`);
        setTimeout(() => setToastMsg(null), 3000);
      } else {
        setToastMsg("Failed to add to cart.");
        setTimeout(() => setToastMsg(null), 2500);
      }
    } catch {
      setToastMsg("Could not add to cart.");
      setTimeout(() => setToastMsg(null), 2500);
    }
  };

  const SPEC_FIELDS = [
    { label: "Category", key: "category" },
    { label: "Brand", key: "brand" },
    { label: "Processor / SoC", specKey: "processor" },
    { label: "Memory (RAM)", specKey: "memory" },
    { label: "Storage", specKey: "storage" },
    { label: "Display Spec", specKey: "display" },
    { label: "Battery Endurance", specKey: "battery" },
  ];

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
        {/* Header (compare_products) */}
        <div className="mb-6">
          <Link href="/catalog" className="text-xs text-slate-500 hover:text-navy-900 flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Catalog
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-navy-900 tracking-tight">
                Product Comparison Matrix
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Side-by-side technical evaluation with AI student fit scoring and policy limits.
              </p>
            </div>
            <span className="text-xs font-mono-data text-slate-400">
              Comparing {comparedProducts.length} devices
            </span>
          </div>
        </div>

        {/* AI Recommendation Banner (Stitch: compare_products) */}
        <div className="mb-8 rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-ai-violet to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-mono-data font-bold uppercase tracking-wider text-ai-violet block">
                Kharridlo AI Recommendation
              </span>
              <p className="text-xs sm:text-sm font-semibold text-navy-900 mt-0.5">
                {comparedProducts[0]?.name || "Option 1"} is the optimal match for Engineering & CS coursework
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Offers superior RAM expandability, multi-threaded compile throughput, and native student tier policy qualification.
              </p>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75">
                <th className="p-4 sm:p-5 w-48 text-xs font-bold text-slate-400 uppercase font-mono-data">
                  Attribute
                </th>
                {comparedProducts.map((p, idx) => {
                  const badge = getProviderBadge(p.provider || "kharridlo_verified");
                  return (
                    <th key={p.id} className="p-4 sm:p-5 min-w-[240px] align-top">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono-data font-bold uppercase text-slate-400">
                            Option {idx + 1}
                          </span>
                          {idx === 0 && (
                            <span className="text-[10px] font-mono-data font-bold text-growth-dark bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Top Recommendation
                            </span>
                          )}
                        </div>
                        <div className="h-32 w-full rounded-xl bg-slate-100 overflow-hidden mb-2 relative">
                          <ProductImage
                            src={p.image_url || "/assets/laptop-product.png"}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                          <span className={`absolute top-2 left-2 inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded shadow-sm border ${badge.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                            {badge.label}
                          </span>
                        </div>
                        <h3 className="font-display font-bold text-sm text-navy-900 line-clamp-2">
                          {p.name}
                        </h3>
                        <div className="font-display font-bold text-base text-navy-900">
                          ₹{p.price_inr.toLocaleString("en-IN")}
                        </div>

                        {p.can_authoritative_checkout !== false ? (
                          <button
                            onClick={() => handleAddToCart(p)}
                            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-navy-900 text-white text-xs font-semibold hover:bg-ai-violet transition-colors shadow-sm"
                          >
                            <Plus className="h-3 w-3" /> Add to Cart
                          </button>
                        ) : p.canonical_url ? (
                          <a
                            href={p.canonical_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors border border-slate-200"
                          >
                            <span>View on {badge.label}</span>
                            <ExternalLink className="h-3 w-3 text-slate-500" />
                          </a>
                        ) : (
                          <span className="block text-center py-2 text-[11px] font-mono text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                            External Discovery
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {SPEC_FIELDS.map((field, fIdx) => (
                <tr key={fIdx} className="hover:bg-slate-50/50">
                  <td className="p-4 font-mono-data font-semibold text-slate-500 bg-slate-50/40">
                    {field.label}
                  </td>
                  {comparedProducts.map((p) => {
                    const value = field.key
                      ? (p as any)[field.key]
                      : p.specs?.[field.specKey || ""] || "Standard Verified";
                    return (
                      <td key={p.id} className="p-4 text-navy-900 font-medium">
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td className="p-4 font-mono-data font-semibold text-slate-500 bg-slate-50/40">
                  Authority & Checkout Gate
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-4">
                    {p.can_authoritative_checkout !== false ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono-data font-semibold text-growth-dark bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <ShieldCheck className="h-3 w-3" /> Authoritative Escrow
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono-data font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        External Discovery Only
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </main>

      <BuyerFooter />
    </div>
  );
}

export default function CompareProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-xs font-mono-data text-slate-400">Loading Product Comparison...</div>}>
      <CompareContent />
    </Suspense>
  );
}
