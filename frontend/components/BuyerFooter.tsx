"use client";

import Link from "next/link";
import { ShieldCheck, Lock, Sparkles, CheckCircle2 } from "lucide-react";
import Logo from "@/components/Logo";

export default function BuyerFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <Logo variant="full" size="md" href="/" />
            <p className="text-xs text-slate-500 leading-relaxed">
              From AI intent to trusted transactions. Kharridlo combines agentic search with deterministic policy enforcement and Razorpay Test Mode.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-growth-dark font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>Zero AI Payment Authority</span>
            </div>
          </div>

          {/* Student Commerce */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-3 font-display">
              Student Commerce
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/catalog" className="hover:text-navy-900 transition-colors">
                  Product Catalog
                </Link>
              </li>
              <li>
                <Link href="/recommendations" className="hover:text-navy-900 transition-colors">
                  AI Recommendations
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-navy-900 transition-colors">
                  Product Comparison
                </Link>
              </li>
              <li>
                <Link href="/assistant" className="hover:text-navy-900 transition-colors">
                  Shopping Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Governance & Policies */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-3 font-display">
              Safety & Policy
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/checkout/authorize" className="hover:text-navy-900 transition-colors">
                  Buyer Authorization Gate
                </Link>
              </li>
              <li>
                <Link href="/merchant/policies" className="hover:text-navy-900 transition-colors">
                  Tiered Spending Limits
                </Link>
              </li>
              <li>
                <Link href="/merchant/system-map" className="hover:text-navy-900 transition-colors">
                  System Architecture Map
                </Link>
              </li>
              <li>
                <Link href="/merchant/orders" className="hover:text-navy-900 transition-colors">
                  Immutable Audit Trail
                </Link>
              </li>
            </ul>
          </div>

          {/* Merchant Operations */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-3 font-display">
              Merchant Operations
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/merchant" className="hover:text-navy-900 transition-colors">
                  Merchant Dashboard
                </Link>
              </li>
              <li>
                <Link href="/merchant/command-center" className="hover:text-navy-900 transition-colors">
                  AI Command Center
                </Link>
              </li>
              <li>
                <Link href="/merchant/activity" className="hover:text-navy-900 transition-colors">
                  Live Activity Feed
                </Link>
              </li>
              <li>
                <Link href="/merchant/revenue-advisor" className="hover:text-navy-900 transition-colors">
                  AI Revenue Advisor
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Subfooter */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 Kharridlo. Autonomous Agentic Commerce Platform.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-slate-500">
              <Lock className="h-3 w-3 text-growth-emerald" />
              Razorpay Secured
            </span>
            <span className="inline-flex items-center gap-1 text-slate-500">
              <ShieldCheck className="h-3 w-3 text-ai-violet" />
              Deterministic Gate Active
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
