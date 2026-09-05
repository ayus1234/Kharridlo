"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  GitCompare,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import ProductImage from "@/components/ProductImage";
import { getProviderBadge } from "@/lib/marketplace";
import { getOrCreateSessionId } from "@/lib/session";

interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price_paise: number;
  price_inr: number;
  specs: Record<string, unknown>;
  image_url?: string;
  provider?: string;
  provider_product_id?: string;
  canonical_url?: string;
  can_authoritative_checkout?: boolean;
}

interface ComparisonRow {
  label: string;
  value: (product: Product) => string;
}

const COMPARE_STORAGE_KEY = "kharridlo:compare:ids";
const MAX_COMPARE_PRODUCTS = 4;

function asText(value: unknown, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value);
}

function readSpec(product: Product, candidates: string[]) {
  const entries = Object.entries(product.specs || {});
  const candidate = entries.find(([key]) =>
    candidates.some((name) => key.toLowerCase().includes(name.toLowerCase()))
  );
  return asText(candidate?.[1]);
}

function normalizeProduct(product: any): Product {
  const priceInr = Number(
    product.price_inr ?? product.source_price_inr ??
      (product.price_paise ?? product.source_price_minor ?? 0) / 100
  );

  return {
    id: String(product.id ?? product.provider_product_id ?? product.sku),
    sku: String(product.sku ?? product.provider_product_id ?? product.id ?? ""),
    name: String(product.name ?? product.title ?? "Untitled product"),
    brand: String(product.brand ?? "Unknown brand"),
    category: String(product.category ?? "Electronics"),
    price_paise: Number(product.price_paise ?? product.source_price_minor ?? Math.round(priceInr * 100)),
    price_inr: Number.isFinite(priceInr) ? priceInr : 0,
    specs: product.specs ?? product.specifications ?? {},
    image_url: product.image_url ?? product.primary_image_url ?? product.images?.[0]?.source_url,
    provider: product.provider ?? "kharridlo_verified",
    provider_product_id: product.provider_product_id,
    canonical_url: product.canonical_url,
    can_authoritative_checkout:
      product.can_authoritative_checkout ?? product.mapping?.can_authoritative_checkout,
  };
}

function rankForStudentFit(product: Product) {
  const hardware = Object.values(product.specs || {}).join(" ").toLowerCase();
  const memory = Number(hardware.match(/(\d+)\s*gb\s*(?:ram|unified memory|ddr)/)?.[1] || 0);
  const storage = Number(hardware.match(/(\d+)\s*(?:gb|tb)\s*(?:ssd|storage|nvme)/)?.[1] || 0);
  const storageScore = storage >= 1024 ? 2 : storage >= 512 ? 1 : 0;
  const priceScore = product.price_inr > 0 ? Math.min(5, 60000 / product.price_inr) : 0;
  const computeScore = /i[5-9]|ryzen [5-9]|m[1-4]|snapdragon|core ultra/.test(hardware) ? 3 : 0;
  return memory * 0.8 + storageScore + priceScore + computeScore;
}

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [highlightDifferences, setHighlightDifferences] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const updateComparison = useCallback(
    (products: Product[]) => {
      const next = products.slice(0, MAX_COMPARE_PRODUCTS);
      setComparedProducts(next);
      const ids = next.map((product) => product.id);
      window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(ids));
      const query = ids.length ? `?ids=${encodeURIComponent(ids.join(","))}` : "?ids=none";
      router.replace(`/compare${query}`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/marketplace/search?page_size=50", { cache: "no-store" });
        if (!response.ok) throw new Error("Catalog request failed");
        const data = await response.json();
        const products: Product[] = (data.items || []).map((product: any) => normalizeProduct(product));
        setAllProducts(products);

        const idsParam = searchParams.get("ids");
        const hasExplicitIds = searchParams.has("ids");
        const legacyIds = [searchParams.get("id1"), searchParams.get("id2")].filter(Boolean) as string[];
        const requestedIds = idsParam && idsParam !== "none" ? idsParam.split(",").filter(Boolean) : legacyIds;
        const storedIds: string[] = !hasExplicitIds && !legacyIds.length
          ? JSON.parse(window.localStorage.getItem(COMPARE_STORAGE_KEY) || "[]")
          : [];
        const ids = (requestedIds.length ? requestedIds : storedIds).slice(0, MAX_COMPARE_PRODUCTS);
        const productById = new Map<string, Product>(products.flatMap((product): [string, Product][] => [[product.id, product], [product.sku, product]]));
        let selected = ids.map((id: string) => productById.get(id)).filter(Boolean) as Product[];

        if (!selected.length && idsParam !== "none") selected = products.slice(0, 2);
        setComparedProducts(selected.slice(0, MAX_COMPARE_PRODUCTS));
      } catch {
        setToastMsg("We could not load products for comparison. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [searchParams]);

  const recommendation = useMemo(() => {
    if (!comparedProducts.length) return null;
    return [...comparedProducts].sort((a, b) => rankForStudentFit(b) - rankForStudentFit(a))[0];
  }, [comparedProducts]);

  const comparisonRows = useMemo<ComparisonRow[]>(() => {
    const coreRows: ComparisonRow[] = [
      { label: "Category", value: (product) => product.category },
      { label: "Brand", value: (product) => product.brand },
      { label: "Processor / SoC", value: (product) => readSpec(product, ["processor", "cpu", "chip", "soc"]) },
      { label: "Memory", value: (product) => readSpec(product, ["memory", "ram", "unified memory"]) },
      { label: "Storage", value: (product) => readSpec(product, ["storage", "ssd", "nvme"]) },
      { label: "Display", value: (product) => readSpec(product, ["display", "screen", "resolution"]) },
      { label: "Battery", value: (product) => readSpec(product, ["battery", "battery life", "endurance"]) },
    ];
    const covered = ["processor", "cpu", "chip", "soc", "memory", "ram", "storage", "ssd", "nvme", "display", "screen", "resolution", "battery"];
    const extraKeys = Array.from(
      new Set(comparedProducts.flatMap((product) => Object.keys(product.specs || {})))
    ).filter((key) => !covered.some((name) => key.toLowerCase().includes(name)));

    return [
      ...coreRows,
      ...extraKeys.map((key) => ({
        label: key,
        value: (product: Product) => asText(product.specs?.[key]),
      })),
    ];
  }, [comparedProducts]);

  const pickerProducts = useMemo(() => {
    const query = pickerQuery.trim().toLowerCase();
    return allProducts.filter((product) => {
      const isAlreadyCompared = comparedProducts.some((compared) => compared.id === product.id);
      const searchable = `${product.name} ${product.brand} ${product.category}`.toLowerCase();
      return !isAlreadyCompared && (!query || searchable.includes(query));
    });
  }, [allProducts, comparedProducts, pickerQuery]);

  const handleRemove = (productId: string) => {
    updateComparison(comparedProducts.filter((product) => product.id !== productId));
  };

  const handleAddProduct = (product: Product) => {
    if (comparedProducts.length >= MAX_COMPARE_PRODUCTS) {
      setToastMsg(`You can compare up to ${MAX_COMPARE_PRODUCTS} products at a time.`);
      return;
    }
    updateComparison([...comparedProducts, product]);
    setPickerQuery("");
    setIsPickerOpen(false);
  };

  const handleAddToCart = async (product: Product) => {
    if (product.can_authoritative_checkout === false) {
      setToastMsg("Marketplace items open with the retailer; only verified products can be added to cart.");
      return;
    }
    try {
      const sessionId = getOrCreateSessionId();
      const response = await fetch(`/api/cart/${sessionId}/items`, {
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
      if (!response.ok) throw new Error("Cart request failed");
      window.dispatchEvent(new Event("cart-updated"));
      setToastMsg(`Added “${product.name}” to cart.`);
    } catch {
      setToastMsg("Could not add this product to the cart.");
    }
  };

  useEffect(() => {
    if (!toastMsg) return;
    const timeout = window.setTimeout(() => setToastMsg(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toastMsg]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <BuyerNavbar />

      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 rounded-xl border border-slate-700 bg-navy-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl">
          <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-growth-emerald" />{toastMsg}</span>
        </div>
      )}

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/catalog" className="mb-2 flex items-center gap-1 text-xs text-slate-500 hover:text-navy-900">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to catalog
          </Link>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">Product Comparison Matrix</h1>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">Choose up to four products and compare the specifications that matter.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-data text-slate-400">Comparing {comparedProducts.length} devices</span>
              <button onClick={() => setIsPickerOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-ai-violet">
                <Plus className="h-3.5 w-3.5" /> Add product
              </button>
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-ai-violet to-indigo-600 text-white shadow-sm"><Sparkles className="h-5 w-5" /></div>
            <div>
              <span className="block text-[10px] font-mono-data font-bold uppercase tracking-wider text-ai-violet">Kharridlo AI recommendation</span>
              <p className="mt-0.5 text-sm font-semibold text-navy-900">
                {recommendation ? `${recommendation.name} is the strongest student-value pick in this comparison.` : "Add products to receive a tailored comparison summary."}
              </p>
              {recommendation && <p className="mt-1 text-xs text-slate-600">It combines the selected configuration with a ₹{recommendation.price_inr.toLocaleString("en-IN")} price point. Use the highlighted rows to weigh the trade-offs.</p>}
            </div>
          </div>
          <button onClick={() => setHighlightDifferences((current) => !current)} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${highlightDifferences ? "border-ai-violet bg-purple-100 text-ai-violet" : "border-slate-200 bg-white text-slate-700 hover:border-purple-200"}`}>
            <GitCompare className="h-3.5 w-3.5" /> {highlightDifferences ? "Differences highlighted" : "Highlight differences"}
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs font-mono-data text-slate-400 shadow-sm">Loading products for comparison…</div>
        ) : comparedProducts.length ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-xs">
              <thead><tr className="border-b border-slate-200 bg-slate-50/75">
                <th className="w-44 p-4 font-mono-data text-xs font-bold uppercase text-slate-400">Attribute</th>
                {comparedProducts.map((product, index) => {
                  const badge = getProviderBadge(product.provider || "kharridlo_verified");
                  return <th key={product.id} className="min-w-[240px] p-4 align-top sm:p-5"><div className="space-y-2">
                    <div className="flex items-center justify-between gap-2"><span className="font-mono-data text-[10px] font-bold uppercase text-slate-400">Option {index + 1}</span><button onClick={() => handleRemove(product.id)} aria-label={`Remove ${product.name}`} className="rounded-md p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"><X className="h-4 w-4" /></button></div>
                    <div className="relative mb-2 h-32 overflow-hidden rounded-xl bg-slate-100"><ProductImage src={product.image_url} alt={product.name} category={product.category} productId={product.id} className="h-full w-full" /><span className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[9px] font-semibold shadow-sm ${badge.badgeClass}`}><span className={`h-1.5 w-1.5 rounded-full ${badge.dotClass}`} />{badge.label}</span></div>
                    <h3 className="line-clamp-2 font-display text-sm font-bold text-navy-900">{product.name}</h3>
                    <div className="font-display text-base font-bold text-navy-900">₹{product.price_inr.toLocaleString("en-IN")}</div>
                    <button onClick={() => handleAddToCart(product)} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-navy-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-ai-violet"><Plus className="h-3 w-3" /> Add to cart</button>
                  </div></th>;
                })}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {comparisonRows.map((row) => {
                  const values = comparedProducts.map(row.value);
                  const hasDifference = new Set(values.map((value) => value.trim().toLowerCase())).size > 1;
                  return <tr key={row.label} className="transition-colors hover:bg-slate-50/50"><td className="bg-slate-50/40 p-4 font-mono-data font-semibold text-slate-500">{row.label}</td>{values.map((value, index) => <td key={`${comparedProducts[index].id}-${row.label}`} className={`p-4 font-medium text-navy-900 ${highlightDifferences && hasDifference ? "bg-amber-50/70" : ""}`}>{value}</td>)}</tr>;
                })}
                <tr><td className="bg-slate-50/40 p-4 font-mono-data font-semibold text-slate-500">Checkout</td>{comparedProducts.map((product) => <td key={product.id} className="p-4"><span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono-data text-[10px] font-semibold text-growth-dark"><ShieldCheck className="h-3 w-3" /> Verified checkout</span></td>)}</tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm"><GitCompare className="mx-auto h-8 w-8 text-slate-400" /><h2 className="mt-3 font-display font-bold text-navy-900">Start a comparison</h2><p className="mt-1 text-xs text-slate-500">Select products from the catalog to see their specifications side by side.</p><button onClick={() => setIsPickerOpen(true)} className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-3 py-2 text-xs font-semibold text-white hover:bg-ai-violet"><Plus className="h-3.5 w-3.5" /> Select products</button></div>
        )}
      </main>

      {isPickerOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Select a product to compare"><div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-display font-bold text-navy-900">Add a product</h2><p className="mt-0.5 text-xs text-slate-500">Choose up to {MAX_COMPARE_PRODUCTS} products.</p></div><button onClick={() => setIsPickerOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="border-b border-slate-100 p-4"><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><Search className="h-4 w-4 text-slate-400" /><input autoFocus value={pickerQuery} onChange={(event) => setPickerQuery(event.target.value)} placeholder="Search by product, brand, or category" className="w-full bg-transparent text-sm text-navy-900 outline-none placeholder:text-slate-400" /></label></div><div className="max-h-[52vh] divide-y divide-slate-100 overflow-y-auto">{pickerProducts.slice(0, 25).map((product) => <button key={product.id} onClick={() => handleAddProduct(product)} className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-purple-50"><div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"><ProductImage src={product.image_url} alt={product.name} category={product.category} productId={product.id} className="h-full w-full" /></div><div className="min-w-0 flex-1"><p className="line-clamp-1 text-sm font-semibold text-navy-900">{product.name}</p><p className="mt-0.5 text-xs text-slate-500">{product.brand} · {product.category}</p></div><span className="font-mono-data text-xs font-bold text-navy-900">₹{product.price_inr.toLocaleString("en-IN")}</span><Plus className="h-4 w-4 text-ai-violet" /></button>)}{!pickerProducts.length && <p className="p-8 text-center text-sm text-slate-500">No additional products match that search.</p>}</div></div></div>}
      <BuyerFooter />
    </div>
  );
}

export default function CompareProductsPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] font-mono-data text-xs text-slate-400">Loading product comparison…</div>}><CompareContent /></Suspense>;
}
