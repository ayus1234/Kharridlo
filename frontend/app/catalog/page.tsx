"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Search, 
  ArrowLeft, 
  RefreshCw, 
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  XCircle,
  X,
  Plus
} from "lucide-react";
import { getOrCreateSessionId } from "@/lib/session";
import AIAssistantDrawer from "@/components/AIAssistantDrawer";

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
  specs: Record<string, any>;
  image_url?: string;
  availability_status: "in_stock" | "low_stock" | "out_of_stock";
  inventory?: {
    available_quantity: number;
    reserved_quantity: number;
    status: string;
  };
}

interface ProductListResponse {
  items: Product[];
  total: number;
  limit: number;
  offset: number;
}

const CATEGORIES = [
  { id: "all", label: "All Items" },
  { id: "laptop", label: "Laptops" },
  { id: "smartphone", label: "Phones" },
  { id: "monitor", label: "Monitors" },
  { id: "keyboard", label: "Keyboards" },
  { id: "mouse", label: "Mice" },
  { id: "headphones", label: "Audio" },
  { id: "tablet", label: "Tablets" },
  { id: "accessories", label: "Accessories" }
];

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartCount, setCartCount] = useState<number>(0);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const sid = getOrCreateSessionId();
    setSessionId(sid);
    fetchCartCount(sid);
  }, []);

  const fetchCartCount = async (sid: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/cart/${sid}`, { cache: "no-store" });
      if (res.ok) {
        const cartData = await res.json();
        setCartCount(cartData.total_items_count || 0);
      }
    } catch {
      // Ignore cart count fetch failure
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${apiBaseUrl}/api/v1/products?limit=50`;

      if (debouncedSearch) {
        url = `${apiBaseUrl}/api/v1/products/search?q=${encodeURIComponent(debouncedSearch)}&limit=50`;
      } else if (selectedCategory !== "all") {
        url = `${apiBaseUrl}/api/v1/products?category=${encodeURIComponent(selectedCategory)}&limit=50`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load catalog: ${res.status} ${res.statusText}`);
      }
      const data: ProductListResponse = await res.json();
      setProducts(data.items);
      setTotal(data.total);
    } catch (err: any) {
      setError(err?.message || "Failed to connect to catalog service");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, debouncedSearch]);

  const addToCart = async (productId: string, productName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAddingId(productId);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/cart/${sessionId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson?.detail?.message || "Failed to add product to cart");
      }
      const updatedCart = await res.json();
      setCartCount(updatedCart.total_items_count);
      setToastMsg(`Added ${productName} to cart!`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || "Unable to reserve inventory for item");
    } finally {
      setAddingId(null);
    }
  };

  const formatPrice = (paise: number) => {
    const inr = paise / 100;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(inr);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              Home
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center space-x-2">
              <span className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                ख
              </span>
              <span className="font-bold text-lg text-slate-900">Kharridlo</span>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded border border-indigo-200">
                Catalog Engine
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-xs text-slate-500 font-mono hidden md:block">
              Deterministic Commerce Layer • Milestone 3
            </div>

            {/* Cart Link with Badge */}
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              <span className="px-1.5 py-0.2 bg-white text-indigo-700 rounded-full font-bold text-[11px]">
                {cartCount}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
          <Link href="/cart" className="underline font-bold text-indigo-300 ml-2">
            View Cart
          </Link>
        </div>
      )}

      {/* Hero Banner & Search */}
      <section className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Synthetic Product Catalog
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Deterministic product database with 84 tech SKUs, precise integer paise pricing, and real-time inventory checks.
            </p>
          </div>

          {/* Search bar */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, brand, or specifications (e.g. laptop, 16GB, mouse)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all shadow-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSearchQuery("");
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id && !searchQuery
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-slate-500 font-medium">
            Showing <span className="font-semibold text-slate-900">{products.length}</span> of{" "}
            <span className="font-semibold text-slate-900">{total}</span> items in database
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Prices stored in paise</span>
            <span>•</span>
            <span>Real-time reservations</span>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="font-bold">
              Dismiss
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-white border border-slate-200 p-4 animate-pulse flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-5 bg-slate-200 rounded w-4/5" />
                  <div className="h-16 bg-slate-100 rounded" />
                </div>
                <div className="h-8 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="p-12 text-center max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm my-12">
            <Search className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 text-base">No products match your search</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Try searching with general terms like &quot;laptop&quot;, &quot;phone&quot;, or relax category filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Clear filters and view all
            </button>
          </div>
        )}

        {/* Product Grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const isOOS = product.availability_status === "out_of_stock";
              const isLow = product.availability_status === "low_stock";
              const isAdding = addingId === product.id;

              return (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="group bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer relative"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                        {product.brand}
                      </span>
                      {/* Availability Tag */}
                      {isOOS ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3" /> Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> In Stock
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">SKU: {product.sku}</p>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>

                    {/* Quick Specs Pills */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {Object.entries(product.specs).slice(0, 3).map(([key, val]) => (
                        <span key={key} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                          {key.replace("_", " ")}: {String(val)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-base font-bold text-slate-900 block">
                        {formatPrice(product.price_paise)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {product.price_paise} paise
                      </span>
                    </div>

                    <button
                      onClick={(e) => addToCart(product.id, product.name, e)}
                      disabled={isOOS || isAdding}
                      className="text-xs font-semibold inline-flex items-center gap-1 text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 px-3 py-1.5 rounded-xl transition-colors shadow-sm"
                    >
                      <Plus className={`w-3.5 h-3.5 ${isAdding ? "animate-spin" : ""}`} />
                      {isOOS ? "OOS" : isAdding ? "Adding..." : "Add to Cart"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-1">
              <span>{selectedProduct.brand}</span>
              <span>•</span>
              <span>{selectedProduct.category}</span>
            </div>

            <h2 className="text-xl font-bold text-slate-900">{selectedProduct.name}</h2>
            <p className="text-xs font-mono text-slate-400 mt-0.5">SKU: {selectedProduct.sku} • ID: {selectedProduct.id}</p>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-slate-900">
                    {formatPrice(selectedProduct.price_paise)}
                  </span>
                  <span className="block text-xs text-slate-400 font-mono">
                    Authoritative: {selectedProduct.price_paise} paise ({selectedProduct.currency})
                  </span>
                </div>
                <div>
                  {selectedProduct.availability_status === "out_of_stock" ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      Out of Stock (0 units)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      In Stock ({selectedProduct.inventory?.available_quantity ?? 1} available)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600 mt-4 leading-relaxed">
              {selectedProduct.description}
            </p>

            {/* Specifications Matrix */}
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Technical Specifications
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(selectedProduct.specs).map(([k, v]) => (
                  <div key={k} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block capitalize">{k.replace("_", " ")}</span>
                    <span className="font-semibold text-slate-800">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Close View
              </button>

              <button
                onClick={() => addToCart(selectedProduct.id, selectedProduct.name)}
                disabled={selectedProduct.availability_status === "out_of_stock" || addingId === selectedProduct.id}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-sm inline-flex items-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" />
                {selectedProduct.availability_status === "out_of_stock" ? "Out of Stock" : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Assistant Drawer */}
      <AIAssistantDrawer onCartUpdated={() => fetchCartCount(sessionId)} />
    </div>
  );
}
