"use client";

import { useEffect, useState, useMemo } from "react";
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
  Sliders,
  Flame, 
  GitCompare, 
  Bot,
  Zap,
  Lock,
  CreditCard,
  Check
} from "lucide-react";
import dynamic from "next/dynamic";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import BentoCard from "@/components/BentoCard";
import Logo from "@/components/Logo";
import { FEATURED_PREVIEW_PRODUCTS, FeaturedProduct } from "@/lib/featured-preview";
import DynamicProductCard, { DynamicProduct } from "@/components/dynamic/DynamicProductCard";
import RequirementSummaryCard, { parseRequirementsFromPrompt } from "@/components/dynamic/RequirementSummaryCard";

const AIAssistantDrawer = dynamic(() => import("@/components/AIAssistantDrawer"), { 
  ssr: false,
  loading: () => null 
});

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
  // Instant Initial Paint: Initialize with lightweight 2KB preview products (0ms, zero-delay)
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>(FEATURED_PREVIEW_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://kharridlo-backend.onrender.com";

  // Parse live requirement preview if user types a query
  const liveRequirements = useMemo(() => {
    return parseRequirementsFromPrompt(prompt);
  }, [prompt]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: any;

    // Defer non-blocking background revalidation until page is fully painted and idle
    const scheduleRevalidation = () => {
      timeoutId = setTimeout(async () => {
        try {
          const isHttpsLocalhost = typeof window !== "undefined" &&
            window.location.protocol === "https:" &&
            apiBaseUrl.startsWith("http://localhost");

          if (isHttpsLocalhost) return;

          const res = await fetch(`${apiBaseUrl}/api/v1/products?limit=6`, {
            cache: "no-store",
            signal: AbortSignal.timeout(2500),
          }).catch(() => null);

          if (res && res.ok && isMounted) {
            const data = await res.json();
            if (data.items && data.items.length > 0) {
              setFeaturedProducts(data.items);
            }
          }
        } catch {
          // Graceful fallback
        }
      }, 3000);
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(scheduleRevalidation);
    } else {
      scheduleRevalidation();
    }

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
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

  const handleProductAdded = (product: DynamicProduct) => {
    setToastMsg(`Added "${product.name}" to cart.`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] overflow-x-hidden">
      <BuyerNavbar />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 rounded-xl bg-navy-900 text-white px-4 py-2.5 text-xs font-semibold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-growth-emerald" />
          <span>{toastMsg}</span>
        </div>
      )}

      <main className="flex-1">
        {/* Hero Section: Intent Engine */}
        <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-gradient-to-b from-white via-purple-50/20 to-[#F8FAFC] border-b border-slate-200/60">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[360px] bg-gradient-to-tr from-purple-200/40 via-emerald-100/30 to-transparent blur-3xl -z-10 pointer-events-none rounded-full" />

          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Kharridlo Brand Logo */}
            <div className="flex justify-center mb-6">
              <Logo variant="compact" size="xl" asLink={false} priority />
            </div>

            {/* Dynamic AI Commerce Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-indigo-200 shadow-2xs mb-4">
              <span className="h-2 w-2 rounded-full bg-growth-emerald animate-pulse" />
              <span className="text-[11px] font-mono-data font-semibold text-navy-900">
                Agentic Commerce • Bounded AI & Razorpay Verified
              </span>
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
                    placeholder="Describe what you need (e.g. 'Laptop for coding under ₹70k')..."
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

              {/* Dynamic Live Requirement Extraction Preview */}
              {liveRequirements && (
                <div className="mt-4 text-left animate-in fade-in slide-in-from-top-2">
                  <RequirementSummaryCard
                    requirements={liveRequirements}
                    onEdit={() => router.push(`/assistant?prompt=${encodeURIComponent(prompt.trim())}`)}
                    compact
                  />
                </div>
              )}

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

              {/* Dual Action CTAs */}
              <div className="mt-6 flex items-center justify-center gap-3">
                <Link
                  href="/assistant"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-bold font-display hover:bg-ai-violet transition-all shadow-sm active:scale-95"
                >
                  <Bot className="w-4 h-4 text-emerald-300" />
                  <span>Start AI Shopping</span>
                </Link>
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold font-display hover:border-slate-300 hover:bg-slate-50 transition-all shadow-2xs"
                >
                  <Layers className="w-4 h-4 text-slate-500" />
                  <span>Explore Hardware Catalog (42 Items)</span>
                </Link>
              </div>
            </div>

            {/* Dynamic AI Commerce Journey Stepper */}
            <div className="mt-12 pt-8 border-t border-slate-200/70 max-w-4xl mx-auto">
              <div className="text-[10px] font-mono-data uppercase tracking-wider text-slate-400 font-semibold mb-3">
                The Kharridlo Commerce Architecture
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-left">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                  <div className="flex items-center gap-1 text-ai-violet text-[10px] font-bold uppercase font-mono-data">
                    <Sparkles className="w-3 h-3" /> Step 1
                  </div>
                  <h4 className="font-display font-bold text-xs text-navy-900 mt-1">Discover</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Natural language intent</p>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                  <div className="flex items-center gap-1 text-indigo-600 text-[10px] font-bold uppercase font-mono-data">
                    <Sliders className="w-3 h-3" /> Step 2
                  </div>
                  <h4 className="font-display font-bold text-xs text-navy-900 mt-1">Understand</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Budget & spec parsing</p>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                  <div className="flex items-center gap-1 text-growth-dark text-[10px] font-bold uppercase font-mono-data">
                    <ShieldCheck className="w-3 h-3" /> Step 3
                  </div>
                  <h4 className="font-display font-bold text-xs text-navy-900 mt-1">Verify Policy</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Deterministic checks</p>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                  <div className="flex items-center gap-1 text-slate-700 text-[10px] font-bold uppercase font-mono-data">
                    <Lock className="w-3 h-3" /> Step 4
                  </div>
                  <h4 className="font-display font-bold text-xs text-navy-900 mt-1">Authorize</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Explicit buyer consent</p>
                </div>

                <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-navy-900 text-white shadow-xs">
                  <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold uppercase font-mono-data">
                    <CreditCard className="w-3 h-3" /> Step 5
                  </div>
                  <h4 className="font-display font-bold text-xs text-white mt-1">Pay & Settle</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Razorpay HMAC verify</p>
                </div>
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
                  Contextual recommendations tailored to engineering, design, and computer science degrees. The agent reasons strictly within defined parameter bounds.
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

        {/* Curated Hardware Catalog Section with Dynamic Product Cards */}
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
                  Curated engineering inventory and verified hardware with qualitative match analysis and Razorpay checkout.
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
                  Full Catalog (42 items)
                </Link>
              </div>
            </div>

            {/* Dynamic Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((p, idx) => (
                <DynamicProductCard
                  key={p.id}
                  product={{
                    id: p.id,
                    name: p.name,
                    brand: p.brand,
                    category: p.category,
                    price_inr: p.price_inr,
                    mrp_inr: p.mrp_inr,
                    description: p.description,
                    image_url: p.image_url,
                    specs: p.specs,
                    matchBadge: idx === 0 ? "Strong Match" : idx < 3 ? "Good Match" : "Alternative",
                  }}
                  priorityImage={idx < 2}
                  onAddToCart={handleProductAdded}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <BuyerFooter />
      <AIAssistantDrawer />
    </div>
  );
}
