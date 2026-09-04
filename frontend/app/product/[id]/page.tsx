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
  AlertCircle
} from "lucide-react";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import ProductImage from "@/components/ProductImage";
import BentoCard from "@/components/BentoCard";
import { getOrCreateSessionId } from "@/lib/session";

interface ProductDetail {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price_paise: number;
  price_inr: number;
  currency: string;
  description: string;
  specs: Record<string, any>;
  image_url?: string;
  availability_status: "in_stock" | "low_stock" | "out_of_stock";
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [bundleSelected, setBundleSelected] = useState(true);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      // First try direct product endpoint
      const res = await fetch(`${apiBaseUrl}/api/v1/products/${productId}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
      } else {
        // Fallback: search products catalog
        const listRes = await fetch(`${apiBaseUrl}/api/v1/products?limit=50`, { cache: "no-store" });
        if (listRes.ok) {
          const listData = await listRes.json();
          const match = (listData.items || []).find((p: any) => p.id === productId || p.sku === productId);
          if (match) {
            setProduct(match);
          } else if (listData.items?.length > 0) {
            // Default to first item
            setProduct(listData.items[0]);
          }
        }
      }
    } catch {
      // Fallback placeholder
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (redirectCart = false) => {
    if (!product) return;
    setAddingToCart(true);
    try {
      const sid = getOrCreateSessionId();
      const res = await fetch(`${apiBaseUrl}/api/v1/cart/${sid}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });

      if (res.ok) {
        if (redirectCart) {
          router.push("/cart");
        } else {
          setToastMsg(`Added "${product.name}" to cart.`);
          setTimeout(() => setToastMsg(null), 3000);
        }
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
                  Student Tier Verified
                </span>
              </div>
            </div>

            {/* Bento Specifications Grid */}
            <BentoCard title="Hardware Architecture & Performance Specs" subtitle="Technical verification matrix for coursework compliance">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(p.specs || {}).map(([key, val], idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-mono-data font-bold uppercase tracking-wider text-slate-400 block">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs font-semibold text-navy-900 mt-0.5 block">
                      {String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </BentoCard>

            {/* Student Accessory Bundle (Upsell from Stitch design) */}
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
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono-data font-bold uppercase text-slate-400">
                  {p.brand}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono-data font-semibold text-growth-dark bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="h-3 w-3" /> In Stock & Reserved
                </span>
              </div>

              <h1 className="font-display font-extrabold text-xl sm:text-2xl text-navy-900 tracking-tight leading-snug">
                {p.name}
              </h1>

              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {p.description}
              </p>

              {/* Price Display */}
              <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono-data text-slate-400 uppercase tracking-wider block">
                    Authoritative Student Total
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-display font-extrabold text-2xl text-navy-900">
                      ₹{p.price_inr.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-slate-400 font-mono-data">
                      ({p.price_paise} paise)
                    </span>
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
