"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ShoppingBag,
  Plus,
  GitCompare,
  Laptop,
  Cpu,
  HardDrive,
  BatteryCharging,
  Layers,
  Zap,
  Check,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import ProductImage from "@/components/ProductImage";
import BentoCard from "@/components/BentoCard";
import { getOrCreateSessionId } from "@/lib/session";
import { getProviderBadge } from "@/lib/marketplace";
import { getCuratedProductById } from "@/lib/curated-catalog";

interface ProductDetail {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price_paise: number;
  price_inr: number;
  mrp_inr?: number | null;
  currency: string;
  description: string;
  original_description?: string | null;
  ai_summary?: string | null;
  specs: Record<string, any>;
  image_url?: string | null;
  availability_status: "in_stock" | "low_stock" | "out_of_stock" | string;
  provider?: string | null;
  canonical_url?: string | null;
  seller_name?: string | null;
  source_rating?: number | null;
  source_review_count?: number | null;
  can_authoritative_checkout?: boolean;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"specs" | "original" | "ai">("specs");

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://kharridlo-backend.onrender.com";

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const isHttpsLocalhost = typeof window !== "undefined" &&
        window.location.protocol === "https:" &&
        apiBaseUrl.startsWith("http://localhost");

      const curated = getCuratedProductById(productId);
      if (isHttpsLocalhost && curated) {
        setProduct({
          id: curated.id,
          sku: curated.provider_product_id,
          name: curated.title,
          brand: curated.brand,
          category: curated.category,
          price_paise: curated.source_price_minor || 0,
          price_inr: curated.source_price_inr || 0,
          mrp_inr: curated.source_mrp_inr,
          currency: curated.source_currency || "INR",
          description: curated.normalized_description || curated.original_description || "",
          original_description: curated.original_description,
          ai_summary: curated.ai_summary,
          specs: curated.specifications || {},
          image_url: curated.primary_image_url || curated.images?.[0]?.source_url,
          availability_status: curated.availability_status,
          provider: curated.provider,
          canonical_url: curated.canonical_url,
          seller_name: curated.seller_name,
          source_rating: curated.source_rating,
          source_review_count: curated.source_review_count,
          can_authoritative_checkout: true,
        });
        setLoading(false);
        return;
      }

      // 1. Check if ID indicates an external marketplace provider
      if (productId.startsWith("amz_") || productId.startsWith("B0")) {
        const cleanId = productId.replace("amz_", "");
        const mRes = await fetch(`${apiBaseUrl}/api/v1/marketplace/products/amazon/${cleanId}`, { cache: "no-store" });
        if (mRes.ok) {
          const mData = await mRes.json();
          setProduct({
            id: mData.id,
            sku: mData.provider_product_id,
            name: mData.title,
            brand: mData.brand,
            category: mData.category,
            price_paise: mData.source_price_minor || 0,
            price_inr: mData.source_price_inr || 0,
            mrp_inr: mData.source_mrp_inr,
            currency: mData.source_currency || "INR",
            description: mData.normalized_description || mData.original_description || "",
            original_description: mData.original_description,
            ai_summary: mData.ai_summary,
            specs: mData.specifications || {},
            image_url: mData.primary_image_url || mData.images?.[0]?.source_url,
            availability_status: mData.availability_status,
            provider: "amazon",
            canonical_url: mData.canonical_url,
            seller_name: mData.seller_name,
            source_rating: mData.source_rating,
            source_review_count: mData.source_review_count,
            can_authoritative_checkout: mData.mapping?.can_authoritative_checkout ?? false,
          });
          setLoading(false);
          return;
        }
      } else if (productId.startsWith("fk_")) {
        const cleanId = productId.replace("fk_", "");
        const mRes = await fetch(`${apiBaseUrl}/api/v1/marketplace/products/flipkart/${cleanId}`, { cache: "no-store" });
        if (mRes.ok) {
          const mData = await mRes.json();
          setProduct({
            id: mData.id,
            sku: mData.provider_product_id,
            name: mData.title,
            brand: mData.brand,
            category: mData.category,
            price_paise: mData.source_price_minor || 0,
            price_inr: mData.source_price_inr || 0,
            mrp_inr: mData.source_mrp_inr,
            currency: mData.source_currency || "INR",
            description: mData.normalized_description || mData.original_description || "",
            original_description: mData.original_description,
            ai_summary: mData.ai_summary,
            specs: mData.specifications || {},
            image_url: mData.primary_image_url || mData.images?.[0]?.source_url,
            availability_status: mData.availability_status,
            provider: "flipkart",
            canonical_url: mData.canonical_url,
            seller_name: mData.seller_name,
            source_rating: mData.source_rating,
            source_review_count: mData.source_review_count,
            can_authoritative_checkout: mData.mapping?.can_authoritative_checkout ?? false,
          });
          setLoading(false);
          return;
        }
      }

      // 2. Try direct Kharridlo product endpoint
      const res = await fetch(`${apiBaseUrl}/api/v1/products/${productId}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setProduct({
          ...data,
          provider: "kharridlo_verified",
          can_authoritative_checkout: true,
        });
      } else {
        // 3. Fallback: search marketplace unified endpoint
        const mSearchRes = await fetch(`${apiBaseUrl}/api/v1/marketplace/search?q=${encodeURIComponent(productId)}&limit=10`, { cache: "no-store" });
        if (mSearchRes.ok) {
          const sData = await mSearchRes.json();
          const match = (sData.items || []).find((p: any) => p.id === productId || p.provider_product_id === productId);
          if (match) {
            setProduct({
              id: match.id,
              sku: match.provider_product_id,
              name: match.title,
              brand: match.brand,
              category: match.category,
              price_paise: match.source_price_minor || 0,
              price_inr: match.source_price_inr || 0,
              mrp_inr: match.source_mrp_inr,
              currency: match.source_currency || "INR",
              description: match.normalized_description || match.original_description || "",
              original_description: match.original_description,
              ai_summary: match.ai_summary,
              specs: match.specifications || {},
              image_url: match.primary_image_url || match.images?.[0]?.source_url,
              availability_status: match.availability_status,
              provider: match.provider,
              canonical_url: match.canonical_url,
              seller_name: match.seller_name,
              source_rating: match.source_rating,
              source_review_count: match.source_review_count,
              can_authoritative_checkout: match.mapping?.can_authoritative_checkout ?? false,
            });
            setLoading(false);
            return;
          }
        }

        // 4. Final fallback: search internal products catalog
        const listRes = await fetch(`${apiBaseUrl}/api/v1/products?limit=50`, { cache: "no-store" });
        if (listRes.ok) {
          const listData = await listRes.json();
          const match = (listData.items || []).find((p: any) => p.id === productId || p.sku === productId);
          if (match) {
            setProduct({
              ...match,
              provider: "kharridlo_verified",
              can_authoritative_checkout: true,
            });
          } else if (listData.items?.length > 0) {
            setProduct({
              ...listData.items[0],
              provider: "kharridlo_verified",
              can_authoritative_checkout: true,
            });
          }
        }
      }
    } catch {
      const fallback = getCuratedProductById(productId);
      if (fallback) {
        setProduct({
          id: fallback.id,
          sku: fallback.provider_product_id,
          name: fallback.title,
          brand: fallback.brand,
          category: fallback.category,
          price_paise: fallback.source_price_minor || 0,
          price_inr: fallback.source_price_inr || 0,
          mrp_inr: fallback.source_mrp_inr,
          currency: fallback.source_currency || "INR",
          description: fallback.normalized_description || fallback.original_description || "",
          original_description: fallback.original_description,
          ai_summary: fallback.ai_summary,
          specs: fallback.specifications || {},
          image_url: fallback.primary_image_url || fallback.images?.[0]?.source_url,
          availability_status: fallback.availability_status,
          provider: fallback.provider,
          canonical_url: fallback.canonical_url,
          seller_name: fallback.seller_name,
          source_rating: fallback.source_rating,
          source_review_count: fallback.source_review_count,
          can_authoritative_checkout: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (redirectCart = false) => {
    if (!product) return;
    setAddingToCart(true);
    try {
      const sid = getOrCreateSessionId();
      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
      let res: Response | null = null;
      if (isHttps && apiBaseUrl.startsWith("http://localhost")) {
        res = await fetch(`/api/cart/${sid}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: product.id, quantity: 1 }),
        });
      } else {
        try {
          res = await fetch(`${apiBaseUrl}/api/v1/cart/${sid}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_id: product.id, quantity: 1 }),
          });
        } catch {
          res = null;
        }
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
      }

      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem("kharridlo_client_cart");
          let list = cached ? JSON.parse(cached) : [];
          if (!Array.isArray(list)) list = [];
          const existing = list.find((i: any) => (i.product_id || i.id) === product.id);
          if (existing) {
            existing.quantity = (existing.quantity || 1) + 1;
          } else {
            list.push({ product_id: product.id, quantity: 1 });
          }
          localStorage.setItem("kharridlo_client_cart", JSON.stringify(list));
        } catch {}
      }

      window.dispatchEvent(new Event("cart-updated"));
      if (redirectCart) {
        router.push("/cart");
      } else {
        setToastMsg(`Added "${product.name}" to cart.`);
        setTimeout(() => setToastMsg(null), 3000);
      }
    } catch {
      setToastMsg("Could not update cart.");
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <BuyerNavbar />
        <main className="flex-1 max-w-6xl w-full mx-auto p-8 animate-pulse space-y-6">
          <div className="h-6 w-32 bg-slate-200 rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-slate-200 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 bg-slate-200 rounded" />
              <div className="h-6 w-1/4 bg-slate-200 rounded" />
              <div className="h-32 bg-slate-200 rounded-xl" />
            </div>
          </div>
        </main>
        <BuyerFooter />
      </div>
    );
  }

  const p = product || {
    id: "prod_laptop_default",
    sku: "SKU-TECH-PRO15",
    name: "TechNova Pro 15.6\" Engineering Workstation",
    brand: "TechNova",
    category: "laptop",
    price_paise: 5499900,
    price_inr: 54999,
    currency: "INR",
    description: "Equipped with Intel Core i7 13th Gen, 16GB High-Speed DDR5, and 512GB NVMe PCIe Gen4 SSD. Certified for CAD, compiler toolchains, and virtualization.",
    specs: {
      processor: "Intel Core i7-13700H (14 Cores, 20 Threads)",
      memory: "16GB DDR5 5200MHz (Upgradable to 64GB)",
      storage: "512GB M.2 NVMe PCIe 4.0 SSD",
      display: "15.6\" FHD (1920x1080) 144Hz IPS Anti-Glare 100% sRGB",
      battery: "76Wh Fast-Charging (up to 10 hours)",
      ports: "Thunderbolt 4, USB-C 3.2, HDMI 2.1, RJ-45 Gigabit",
    },
    availability_status: "in_stock" as const,
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/catalog" className="hover:text-navy-900 flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Product Catalog
          </Link>
          <span>/</span>
          <span className="capitalize">{p.category}</span>
          <span>/</span>
          <span className="text-navy-900 font-semibold truncate max-w-xs">{p.name}</span>
        </div>

        {/* Primary PDP Layout (laptop_pro_15_details) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Gallery & Bento Specs (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Main Product Hero Image */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
                <ProductImage
                  src={p.image_url || "/assets/laptop-product.png"}
                  alt={p.name}
                  width={600}
                  height={400}
                  priority={true}
                  className="h-full w-full object-cover"
                />
                <span className="absolute top-3 left-3 text-[10px] font-mono-data font-bold uppercase tracking-wider text-growth-dark bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
                  {p.provider === "amazon" ? "Amazon Creators Catalog" : p.provider === "flipkart" ? "Flipkart Affiliate Feed" : "Student Tier Verified"}
                </span>
              </div>
            </div>

            {/* Provenance & Description Tabs */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("specs")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === "specs"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Verified Specifications
                </button>
                <button
                  onClick={() => setActiveTab("original")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === "original"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Original Description
                </button>
                <button
                  onClick={() => setActiveTab("ai")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap ${
                    activeTab === "ai"
                      ? "bg-purple-900 text-white"
                      : "text-purple-700 hover:bg-purple-50"
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  AI Summary
                </button>
              </div>

              {activeTab === "specs" && (
                <div>
                  <div className="text-[11px] font-mono text-slate-400 mb-3 uppercase tracking-wider">
                    Structured Technical Attributes:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(p.specs || {}).length > 0 ? (
                      Object.entries(p.specs || {}).map(([key, val], idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                            {key.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 mt-0.5 block">
                            {String(val)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">Specifications not provided by marketplace</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "original" && (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Exact provider text ({getProviderBadge(p.provider || "kharridlo_verified").label}):
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-60 overflow-y-auto">
                    {p.original_description || p.description || "Original description not provided by marketplace"}
                  </div>
                </div>
              )}

              {activeTab === "ai" && (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-purple-700 flex items-center gap-1 font-semibold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    Kharridlo AI Synthesized Overview:
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed bg-purple-50/40 p-4 rounded-xl border border-purple-100">
                    {p.ai_summary || p.description || "AI summary not available"}
                  </div>
                </div>
              )}
            </div>

            {/* Student Accessory Bundle */}
            <BentoCard
              title="Student Productivity Bundle"
              subtitle="Frequently authorized together by Engineering students"
              aiInsight={true}
              badge="Save ₹2,500"
              badgeType="emerald"
            >
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-white border border-purple-200 flex items-center justify-center text-ai-violet font-display font-bold text-sm">
                    +Hub
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-navy-900">
                      7-in-1 USB-C Multiport Dock + 100W PD Cable
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Includes 4K HDMI, Gigabit Ethernet, SD card reader, 2x USB 3.2
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-navy-900 font-display">
                    +₹1,999
                  </div>
                  <span className="text-[10px] text-slate-400 line-through">₹4,499</span>
                </div>
              </div>
            </BentoCard>
          </div>

          {/* Right Column: AI Fit Card & Purchase Actions (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Core Pricing & Buy Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getProviderBadge(p.provider || "kharridlo_verified").badgeClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getProviderBadge(p.provider || "kharridlo_verified").dotClass}`} />
                    {getProviderBadge(p.provider || "kharridlo_verified").label}
                  </span>
                  <span className="text-xs font-mono-data font-bold uppercase text-slate-400">
                    {p.brand}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono-data font-semibold text-growth-dark bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="h-3 w-3" /> {p.availability_status === "out_of_stock" ? "Out of Stock" : "In Stock & Verified"}
                </span>
              </div>

              <h1 className="font-display font-extrabold text-xl sm:text-2xl text-navy-900 tracking-tight leading-snug">
                {p.name}
              </h1>

              {/* Seller / Marketplace ID */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1.5">
                {p.seller_name && <span>Sold by: <strong>{p.seller_name}</strong></span>}
                {p.sku && <span className="font-mono text-slate-400">ID: {p.sku}</span>}
              </div>

              {/* Reviews & Ratings: Honest Provenance */}
              <div className="mt-2 text-xs">
                {p.source_rating ? (
                  <span className="font-bold text-amber-600">★ {p.source_rating.toFixed(1)} ({p.source_review_count || 0} reviews)</span>
                ) : (
                  <span className="text-slate-400 italic text-[11px]">Ratings: Not provided by marketplace</span>
                )}
              </div>

              {/* Price Display */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono-data text-slate-400 uppercase tracking-wider block">
                    {p.can_authoritative_checkout ? "Authoritative Student Total" : "Marketplace List Price"}
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-display font-extrabold text-2xl text-navy-900">
                      ₹{p.price_inr.toLocaleString("en-IN")}
                    </span>
                    {p.mrp_inr && p.mrp_inr > p.price_inr && (
                      <span className="text-xs text-slate-400 line-through">
                        ₹{p.mrp_inr.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-mono-data font-bold text-growth-dark bg-emerald-100/60 px-2 py-1 rounded">
                  0% Student EMI
                </span>
              </div>

              {/* Primary CTAs */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => handleAddToCart(true)}
                  disabled={addingToCart}
                  className="w-full py-3 px-4 rounded-xl bg-navy-900 text-white font-display font-bold text-xs uppercase tracking-wider hover:bg-ai-violet active:scale-98 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4 text-growth-emerald" />
                  <span>Authorize & Checkout</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAddToCart(false)}
                    disabled={addingToCart}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-navy-900 font-semibold text-xs hover:bg-slate-50 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Add to Cart</span>
                  </button>

                  <Link
                    href={`/compare?id1=${p.id}`}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-navy-900 font-semibold text-xs hover:bg-slate-50 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                  >
                    <GitCompare className="h-3.5 w-3.5" />
                    <span>Compare</span>
                  </Link>
                </div>

                {p.canonical_url && (
                  <a
                    href={p.canonical_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-all flex items-center justify-center gap-2 border border-slate-200/80"
                  >
                    <span>View original on {getProviderBadge(p.provider || "").label}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                  </a>
                )}
              </div>
            </div>

            {/* AI Fit Score Card (Stitch: laptop_pro_15_details) */}
            <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-b from-purple-50/50 to-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-ai-violet" />
                  <h3 className="font-display font-bold text-sm text-navy-900">
                    AI Student Fit Analysis
                  </h3>
                </div>
                <span className="text-xs font-mono-data font-bold text-ai-violet bg-purple-100 px-2.5 py-0.5 rounded-full">
                  98% Compatibility
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-growth-emerald mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">
                    <strong>Compiler & IDE Ready:</strong> Exceeds minimum RAM and multi-core thresholds for Docker, VS Code, and Android Studio.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-growth-emerald mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">
                    <strong>Campus Mobility:</strong> 1.68kg chassis with 76Wh battery provides all-day endurance in lectures.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-ai-violet mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">
                    <strong>Policy Tier:</strong> Eligible under Tier 2 university student limits with 1-click biometric authorization.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BuyerFooter />
    </div>
  );
}
