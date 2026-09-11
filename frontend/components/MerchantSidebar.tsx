"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  LineChart,
  Activity,
  Users,
  GitCommit,
  ShieldCheck,
  FileText,
  Sparkles,
  RotateCcw,
  Network,
  ShoppingBag,
  ChevronRight,
  Menu,
  X,
  Cpu,
  Server
} from "lucide-react";

import Logo from "@/components/Logo";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: string;
}

export default function MerchantSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setMobileOpen((prev) => !prev);
    window.addEventListener("toggle-merchant-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-merchant-sidebar", handleToggle);
  }, []);

  // Automatically close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const coreNavItems: NavItem[] = [
    { href: "/merchant", label: "Dashboard Overview", icon: LayoutDashboard, exact: true },
    { href: "/merchant/command-center", label: "AI Command Center", icon: Radio },
    { href: "/merchant/analytics", label: "Commerce Analytics", icon: LineChart },
    { href: "/merchant/activity", label: "Live Activity Feed", icon: Activity },
    { href: "/merchant/system-map", label: "System Connectivity", icon: Network },
  ];

  const governanceNavItems: NavItem[] = [
    { href: "/merchant/sessions", label: "Active AI Sessions", icon: Users },
    { href: "/merchant/lifecycle", label: "Transaction Lifecycle", icon: GitCommit },
    { href: "/merchant/policies", label: "Policy Center", icon: ShieldCheck },
    { href: "/merchant/orders", label: "Orders & Audit Logs", icon: FileText },
    { href: "/merchant/revenue-advisor", label: "AI Revenue Advisor", icon: Sparkles, badge: "AI" },
    { href: "/merchant/recovery", label: "Inventory Recovery", icon: RotateCcw },
  ];

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="space-y-1">
      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono-data">
        {title}
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact 
          ? pathname === item.href 
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`relative group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium min-h-[38px] transition-all ${
              isActive
                ? "bg-slate-800/90 text-white font-semibold shadow-inner"
                : "text-slate-400 hover:text-white hover:bg-slate-800/40"
            }`}
          >
            {/* Active Indicator Bar */}
            {isActive && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-growth-emerald" />
            )}
            <div className="flex items-center gap-2.5">
              <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-growth-emerald" : "text-slate-400 group-hover:text-slate-200"}`} />
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-ai-violet/20 text-ai-glow border border-ai-violet/30 font-mono-data">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  const renderNavLinks = () => (
    <nav className="p-3 space-y-4">
      {renderNavGroup("Core Operations", coreNavItems)}
      {renderNavGroup("Governance & Audits", governanceNavItems)}

      {/* Autonomous Engine Health Card */}
      <div className="mt-3 p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-2 text-[11px] font-mono-data">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-300 font-semibold text-xs">
            <Cpu className="w-3.5 h-3.5 text-ai-violet" />
            Engine Health
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
            ONLINE
          </span>
        </div>
        <div className="space-y-1 text-[10px] text-slate-400">
          <div className="flex justify-between">
            <span className="text-slate-500">Database</span>
            <span className="text-slate-300 font-medium">PostgreSQL 16</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Deterministic Gate</span>
            <span className="text-emerald-400 font-medium">Enforced</span>
          </div>
        </div>
      </div>
    </nav>
  );

  const renderFooter = () => (
    <div className="p-4 border-t border-slate-800/80 space-y-3">
      <Link
        href="/"
        onClick={() => setMobileOpen(false)}
        className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/60 hover:bg-slate-800 hover:text-white border border-slate-700/50 transition-colors min-h-[40px]"
      >
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-growth-emerald" />
          <span>Buyer Storefront</span>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-500" />
      </Link>

      <div className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] font-mono-data">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span>System Telemetry</span>
          <span className="inline-flex items-center gap-1 text-growth-emerald font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-growth-emerald animate-pulse"></span>
            LIVE
          </span>
        </div>
        <div className="text-slate-500 text-[10px]">
          Policy Gate: <span className="text-slate-300 font-semibold">Enforced</span>
        </div>
        <div className="text-slate-500 text-[10px]">
          Zero AI Payment Authority: <span className="text-emerald-400 font-semibold">Active</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop & Tablet Sticky Sidebar (md and above) - Locked to viewport height */}
      <aside className="hidden md:flex w-64 lg:w-72 flex-shrink-0 bg-navy-900 border-r border-slate-800 text-slate-300 h-screen sticky top-0 flex-col select-none z-30">
        {/* Merchant Brand Header - Fixed at Top */}
        <div className="p-4 border-b border-slate-800/80 flex items-center flex-shrink-0">
          <div className="inline-flex items-center bg-white px-3 py-1.5 rounded-2xl shadow-sm">
            <Logo variant="compact" size="sm" href="/merchant" />
          </div>
        </div>

        {/* Scrollable Nav Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {renderNavLinks()}
        </div>

        {/* Fixed Bottom Footer */}
        <div className="flex-shrink-0">
          {renderFooter()}
        </div>
      </aside>

      {/* Mobile Slide-Over Drawer (Below md / phones only) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-navy-900/80 backdrop-blur-xs transition-opacity" 
            onClick={() => setMobileOpen(false)} 
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-navy-900 text-slate-300 shadow-2xl border-r border-slate-800 z-10 animate-in slide-in-from-left duration-200 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="inline-flex items-center bg-white px-3 py-1.5 rounded-xl shadow-sm">
                <Logo variant="compact" size="sm" href="/merchant" />
              </div>

              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close Merchant Navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {renderNavLinks()}
            </div>

            <div className="flex-shrink-0">
              {renderFooter()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
