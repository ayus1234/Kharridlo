"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  Sparkles, 
  Search, 
  ShoppingCart, 
  Bot, 
  Layers, 
  GitCompare, 
  ShieldCheck, 
  BarChart2, 
  Menu, 
  X 
} from "lucide-react";
import { getOrCreateSessionId } from "@/lib/session";

import Logo from "@/components/Logo";

export default function BuyerNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [cartCount, setCartCount] = useState<number>(0);
  const [searchIntent, setSearchIntent] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://kharridlo-backend.onrender.com";

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const sid = getOrCreateSessionId();
        const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
        const url = (isHttps && apiBaseUrl.startsWith("http://localhost"))
          ? `/api/cart/${sid}`
          : `${apiBaseUrl}/api/v1/cart/${sid}`;
        let res: Response | null = null;
        try {
          res = await fetch(url, { cache: "no-store" });
        } catch {
          res = await fetch(`/api/cart/${sid}`, { cache: "no-store" });
        }
        if (!res || !res.ok) {
          res = await fetch(`/api/cart/${sid}`, { cache: "no-store" });
        }
        if (res && res.ok) {
          const data = await res.json();
          let count = data.total_items_count || 0;
          if (count === 0 && url !== `/api/cart/${sid}`) {
            const fallbackRes = await fetch(`/api/cart/${sid}`, { cache: "no-store" }).catch(() => null);
            if (fallbackRes && fallbackRes.ok) {
              const fbData = await fallbackRes.json();
              if (fbData.total_items_count) {
                count = fbData.total_items_count;
              }
            }
          }
          setCartCount(count);
        }
      } catch {
        // Fallback
      }
    };
    fetchCount();
    const handleCartUpdate = () => fetchCount();
    window.addEventListener("cart-updated", handleCartUpdate);
    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, [pathname, apiBaseUrl]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchIntent.trim()) {
      router.push(`/assistant?prompt=${encodeURIComponent(searchIntent.trim())}`);
    }
  };

  const navLinks = [
    { href: "/catalog", label: "Catalog", icon: Layers },
    { href: "/assistant", label: "AI Assistant", icon: Bot, highlight: true },
    { href: "/recommendations", label: "Recommended", icon: Sparkles },
    { href: "/compare", label: "Compare", icon: GitCompare },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo & Brand Wordmark */}
          <div className="flex items-center gap-3">
            <Logo variant="compact" size="md" priority href="/" />
          </div>

          {/* AI Search & Intent Input */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchIntent}
                onChange={(e) => setSearchIntent(e.target.value)}
                placeholder="Ask Kharridlo AI (e.g. 'Laptop for 2nd year CS student')..."
                className="w-full rounded-full border border-slate-200 bg-slate-50/80 pl-10 pr-10 py-2 text-xs text-navy-900 placeholder:text-slate-400 focus:border-ai-violet focus:bg-white focus:outline-none focus:ring-2 focus:ring-ai-violet/20 transition-all font-sans"
              />
              <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <button 
                type="submit" 
                className="absolute right-2.5 top-2 rounded-full p-1 text-ai-violet hover:bg-purple-50 transition-colors"
                title="Search with AI"
              >
                <Sparkles className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-navy-900 text-white shadow-sm"
                      : link.highlight
                      ? "bg-purple-50 text-ai-violet hover:bg-purple-100"
                      : "text-slate-600 hover:text-navy-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-growth-emerald" : ""}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-2.5">
            {/* Merchant Portal Quick Switch */}
            <Link
              href="/merchant"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-navy-900 hover:text-white transition-all border border-slate-200"
              title="Merchant Intelligence & Audit Portal"
            >
              <BarChart2 className="h-3 w-3" />
              <span>Merchant</span>
            </Link>

            {/* Cart Icon with Counter */}
            <Link
              href="/cart"
              className="relative inline-flex items-center justify-center p-2 rounded-xl text-navy-900 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px]"
              aria-label="View Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-growth-dark px-1 text-[10px] font-bold text-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Profile Headshot */}
            <div className="relative h-8 w-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
              <Image 
                src="/assets/user-avatar.png" 
                alt="Ayush Nathani" 
                width={32} 
                height={32} 
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 py-3 space-y-2">
            <form onSubmit={handleSearchSubmit} className="mb-3">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchIntent}
                  onChange={(e) => setSearchIntent(e.target.value)}
                  placeholder="Ask AI Assistant..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-ai-violet min-h-[44px]"
                />
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              </div>
            </form>
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-3 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 min-h-[44px]"
                >
                  <link.icon className="h-4 w-4 text-ai-violet" />
                  {link.label}
                </Link>
              ))}
              <Link
                href="/merchant"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-3 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 min-h-[44px]"
              >
                <BarChart2 className="h-4 w-4" />
                Merchant Portal
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
