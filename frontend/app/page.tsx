"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  Search, 
  ArrowRight, 
  Laptop, 
  Cpu, 
  Headphones, 
  ShieldCheck, 
  CheckCircle2, 
  Layers, 
  Star, 
  Flame, 
  GitCompare, 
  Bot,
  Zap,
  TrendingUp,
  Server
} from "lucide-react";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import ProductImage from "@/components/ProductImage";
import BentoCard from "@/components/BentoCard";
import AIAssistantDrawer from "@/components/AIAssistantDrawer";
import Logo from "@/components/Logo";

interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price_paise: number;
  price_inr: number;
  currency: string;
  description: string;
  availability_status: "in_stock" | "low_stock" | "out_of_stock";
  image_url?: string;
}

const INTENT_PILLS = [
  "Laptops for CS & Coding under ₹60k",
  "Noise-cancelling headsets for study",
  "Mechanical keyboards with silent switches",
  "27-inch 4K developer monitors",
  "Ergonomic student desk accessories",
];

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(true);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/v1/products?limit=6`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setFeaturedProducts(data.items || []);
        } else {
          setBackendOnline(false);
        }
      } catch {
        setBackendOnline(false);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, [apiBaseUrl]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      router.push(`/assistant?prompt=${encodeURIComponent(prompt.trim())}`);
    }
  };

  const handlePillClick = (query: string) => {
    setPrompt(query);
    router.push(`/assistant?prompt=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] overflow-x-hidden">
      <BuyerNavbar />

      <main className="flex-1">
        {/* Hero Section: Intent Engine */}
        <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-gradient-to-b from-white via-purple-50/20 to-[#F8FAFC] border-b border-slate-200/60">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-purple-200/40 via-emerald-100/30 to-transparent blur-3xl -z-10 pointer-events-none rounded-full" />

          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Kharridlo Full Logo Asset */}
            <div className="flex justify-center mb-6">
              <Logo variant="full" size="xl" asLink={false} priority />
            </div>

            {/* Student AI Commerce Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-900 text-white text-xs font-semibold shadow-sm mb-6">
              <span className="h-2 w-2 rounded-full bg-growth-emerald animate-pulse" />
              <span>Kharridlo AI Commerce Engine</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-mono-data text-[11px]">Precision-Luxury</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-navy-900 tracking-tight font-display max-w-4xl mx-auto leading-[1.15]">
              AI proposes. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-ai-violet via-indigo-600 to-growth-emerald">
                You authorize.
              </span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Autonomous student commerce verified by deterministic policy checks and Razorpay Test Mode. Zero hallucinated payments.
            </p>

            {/* AI Intent Search Bar */}
            <div className="mt-8 max-w-2xl mx-auto">
              <form onSubmit={handleSearch} className="relative group">
                <div className="relative flex items-center rounded-2xl border-2 border-slate-200 bg-white p-2 shadow-lg shadow-purple-500/5 group-focus-within:border-ai-violet group-focus-within:ring-4 group-focus-within:ring-purple-100 transition-all">
                  <div className="pl-3 text-ai-violet">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your student setup (e.g. 'Laptop for AI/ML coursework under ₹70k')..."
                    className="w-full bg-transparent px-3 py-2 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none font-sans"
                  />
                  <button
                    type="submit"
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-bold font-display hover:bg-ai-violet active:scale-95 transition-all shadow-sm"
                  >
                    <span>Ask AI</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>

              {/* Intent Suggestion Chips */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="text-[11px] font-mono-data uppercase tracking-wider text-slate-400 mr-1">
                  Try asking:
                </span>
                {INTENT_PILLS.map((pill, i) => (
                  <button
                    key={i}
                    onClick={() => handlePillClick(pill)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white border border-slate-200/80 text-slate-600 hover:text-ai-violet hover:border-purple-300 hover:bg-purple-50/50 active:scale-95 transition-all shadow-2xs"
                  >
                    <span>{pill}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section className="py-12 bg-white border-b border-slate-200/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Bounded AI Assistance */}
              <BentoCard
                title="AI Proposes Intelligently"
                subtitle="Gemini 2.0 Agent with 7 Bounded Tools"
                aiInsight={true}
                badge="AI Native"
                badgeType="ai"
              >
                <p className="text-xs text-slate-600 leading-relaxed">
                  Contextual recommendations tailored to engineering, design, and computer science degrees. The agent reasons within strict parameter bounds.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href="/assistant"
                    className="inline-flex items-center gap-1 text-xs font-bold text-ai-violet hover:underline"
                  >
                    Open AI Shopping Assistant <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </BentoCard>

              {/* Card 2: Deterministic Policy Engine */}
              <BentoCard
                title="Deterministic Policy Gates"
                subtitle="Zero AI Payment Authority"
                badge="Governance"
                badgeType="emerald"
              >
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tiered student spending limits (Tier 1: ₹10k, Tier 2: ₹25k, Tier 3: ₹50k) evaluated strictly on the backend with required explicit buyer sign-off.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href="/merchant/policies"
                    className="inline-flex items-center gap-1 text-xs font-bold text-growth-dark hover:underline"
                  >
                    Explore Policy Center <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </BentoCard>

              {/* Card 3: Razorpay Test Mode */}
              <BentoCard
                title="Razorpay Test Mode"
                subtitle="HMAC-SHA256 Cryptographic Verification"
                badge="Payments"
                badgeType="neutral"
              >
                <p className="text-xs text-slate-600 leading-relaxed">
                  Production-grade payment security pipeline with webhook verification, row-level inventory locks, and immutable audit logs.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href="/cart"
                    className="inline-flex items-center gap-1 text-xs font-bold text-navy-900 hover:underline"
                  >
                    View Cart & Payment Gate <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </BentoCard>
            </div>
          </div>
        </section>

        {/* Curated Hardware Catalog Section */}
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-growth-dark border border-emerald-200 font-mono-data mb-2">
                  <Sparkles className="h-3 w-3" /> Recommended for Students
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold font-display text-navy-900 tracking-tight">
                  Verified Engineering & Developer Gear
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Synthetic catalog verified with integer paise calculations and live availability.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/recommendations"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-ai-violet bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors shadow-2xs"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Recommended
                </Link>
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-navy-900 hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <Layers className="h-3.5 w-3.5" />
                  Full Catalog ({featuredProducts.length > 0 ? "84 items" : "Loading..."})
                </Link>
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
                ))
              ) : featuredProducts.length > 0 ? (
                featuredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-purple-200 transition-all"
                  >
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-mono-data font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {p.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono-data font-semibold text-growth-dark bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="h-2.5 w-2.5" /> In Stock
                      </span>
                    </div>

                    {/* Image Preview */}
                    <Link href={`/product/${p.id}`} className="block overflow-hidden rounded-xl bg-slate-50 mb-4 aspect-video">
                      <ProductImage
                        src={p.image_url || "/assets/laptop-product.png"}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    {/* Product Metadata */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 font-mono-data">
                          {p.brand}
                        </span>
                        <h3 className="font-display font-bold text-sm text-navy-900 line-clamp-1 group-hover:text-ai-violet transition-colors">
                          <Link href={`/product/${p.id}`}>{p.name}</Link>
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {p.description}
                        </p>
                      </div>

                      {/* Price & Action */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-mono-data">Student Price</span>
                          <span className="font-display font-bold text-base text-navy-900">
                            ₹{p.price_inr.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/compare?id1=${p.id}`}
                            className="p-2 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                            title="Compare specs"
                          >
                            <GitCompare className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/product/${p.id}`}
                            className="px-3 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-semibold hover:bg-ai-violet transition-colors"
                          >
                            View Specs
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
                  <Laptop className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Catalog Initializing</p>
                  <p className="text-xs text-slate-500 mt-1">Loading synthetic hardware inventory...</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* System Trust & Connectivity Strip */}
        <section className="py-8 bg-slate-900 text-slate-300 border-t border-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono-data">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-growth-emerald animate-pulse" />
                <span>Deterministic Security Engine: Active</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">PostgreSQL 16 Engine</span>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/merchant/system-map" className="text-emerald-400 hover:underline flex items-center gap-1">
                  <Server className="h-3.5 w-3.5" /> View System Connectivity Map
                </Link>
                <Link href="/merchant" className="text-slate-400 hover:text-white">
                  Merchant Portal →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BuyerFooter />
      <AIAssistantDrawer />
    </div>
  );
}
