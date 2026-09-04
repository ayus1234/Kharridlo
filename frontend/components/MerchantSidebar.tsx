"use client";

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
  ExternalLink,
  ChevronRight
} from "lucide-react";

export default function MerchantSidebar() {
  const pathname = usePathname();

  const navigationItems = [
    { href: "/merchant", label: "Dashboard Overview", icon: LayoutDashboard, exact: true },
    { href: "/merchant/command-center", label: "AI Command Center", icon: Radio },
    { href: "/merchant/analytics", label: "Commerce Analytics", icon: LineChart },
    { href: "/merchant/activity", label: "Live Activity Feed", icon: Activity },
    { href: "/merchant/sessions", label: "Active AI Sessions", icon: Users },
    { href: "/merchant/lifecycle", label: "Transaction Lifecycle", icon: GitCommit },
    { href: "/merchant/policies", label: "Policy Center", icon: ShieldCheck },
    { href: "/merchant/orders", label: "Orders & Audit Logs", icon: FileText },
    { href: "/merchant/revenue-advisor", label: "AI Revenue Advisor", icon: Sparkles, badge: "AI" },
    { href: "/merchant/recovery", label: "Inventory Recovery", icon: RotateCcw },
    { href: "/merchant/system-map", label: "System Connectivity", icon: Network },
  ];

  return (
    <aside className="w-72 flex-shrink-0 bg-navy-900 border-r border-slate-800 text-slate-300 min-h-screen flex flex-col justify-between select-none">
      <div>
        {/* Merchant Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <Link href="/merchant" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-growth-emerald/10 border border-growth-emerald/30 flex items-center justify-center text-growth-emerald font-display font-bold text-lg shadow-sm">
              ख
            </div>
            <div>
              <span className="font-display font-bold text-lg text-white tracking-tight block">
                Kharridlo
              </span>
              <span className="text-[10px] font-mono-data tracking-wider uppercase text-emerald-400 font-semibold block -mt-0.5">
                Merchant Intellect
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Section */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono-data">
            Autonomous Operations
          </div>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-slate-800/90 text-white font-semibold shadow-inner"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-growth-emerald" />
                )}
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? "text-growth-emerald" : "text-slate-400 group-hover:text-slate-200"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-ai-violet/20 text-ai-glow border border-ai-violet/30 font-mono-data">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status & Storefront Switch */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">
        <Link
          href="/"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/60 hover:bg-slate-800 hover:text-white border border-slate-700/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-3.5 w-3.5 text-growth-emerald" />
            <span>Buyer Storefront</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
        </Link>

        <div className="px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] font-mono-data">
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
    </aside>
  );
}
