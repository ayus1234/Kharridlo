"use client";

import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, RefreshCw, Radio, Menu } from "lucide-react";

interface MerchantHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  isSimulated?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function MerchantHeader({
  title,
  subtitle,
  breadcrumbs = [{ label: "Merchant", href: "/merchant" }],
  isSimulated = true,
  onRefresh,
  isLoading = false,
}: MerchantHeaderProps) {
  const handleToggleSidebar = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("toggle-merchant-sidebar"));
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
      {/* Mobile Drawer Trigger & Breadcrumb */}
      <div className="flex items-center min-w-0 flex-1 mr-2">
        {/* Mobile Hamburger Button */}
        <button
          onClick={handleToggleSidebar}
          className="lg:hidden p-2 -ml-2 mr-2 rounded-xl text-slate-700 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
          aria-label="Toggle Merchant Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <nav className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium truncate">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-slate-300">/</span>}
                {b.href ? (
                  <Link href={b.href} className="hover:text-navy-900 transition-colors truncate">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-navy-900 font-semibold truncate">{b.label}</span>
                )}
              </span>
            ))}
          </nav>
          <h1 className="text-base sm:text-lg font-bold text-navy-900 font-display tracking-tight truncate mt-0.5">
            {title}
          </h1>
        </div>
      </div>

      {/* Center / Right Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Data Integrity Marker */}
        {isSimulated ? (
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono-data font-semibold bg-purple-50 text-ai-violet border border-purple-200">
            <Radio className="h-3 w-3 animate-pulse" />
            Simulated Real-Time Stream
          </span>
        ) : (
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono-data font-semibold bg-emerald-50 text-growth-dark border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Authoritative Audit API
          </span>
        )}

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-50 min-h-[44px]"
            title="Refresh View"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}

        {/* Profile Headshot */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="relative h-8 w-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
            <Image
              src="/assets/user-avatar.png"
              alt="Merchant Lead"
              width={32}
              height={32}
              className="object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-navy-900 leading-none">Priya Sharma</div>
            <div className="text-[10px] font-mono-data text-slate-400 mt-0.5">Merchant Ops Lead</div>
          </div>
        </div>
      </div>
    </header>
  );
}
