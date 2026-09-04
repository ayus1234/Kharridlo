"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Lock, ArrowRight, CheckCircle2, UserCheck, HelpCircle } from "lucide-react";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";

function TransactionBlockedContent() {
  const searchParams = useSearchParams();
  const ruleCode = searchParams.get("rule") || "TIER_1_LIMIT_EXCEEDED";
  const observedAmount = searchParams.get("amount") || "₹18,500";
  const threshold = searchParams.get("threshold") || "₹10,000";

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <BuyerNavbar />

      <main className="flex-1 flex items-center justify-center p-6">
        {/* Policy Hard Block Card (Stitch: transaction_blocked_1 & transaction_blocked_2) */}
        <div className="w-full max-w-xl rounded-3xl border-2 border-rose-200 bg-white p-8 sm:p-10 shadow-xl">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0 shadow-sm">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div>
              <span className="text-[10px] font-mono-data font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Governance Interception
              </span>
              <h1 className="font-display font-bold text-xl sm:text-2xl text-navy-900 mt-1">
                Transaction Blocked by Policy
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic policy rule evaluation failed on backend
              </p>
            </div>
          </div>

          {/* Rule Breakdown Box */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 font-mono-data text-xs space-y-3 mb-6">
            <div className="flex items-center justify-between text-slate-600 pb-2 border-b border-slate-200">
              <span>Rule Code:</span>
              <span className="text-rose-700 font-bold">{ruleCode}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Observed Amount:</span>
              <span className="text-navy-900 font-bold">{observedAmount}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Tier 1 Maximum Cap:</span>
              <span className="text-slate-700 font-semibold">{threshold}</span>
            </div>
            <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-200 font-sans leading-relaxed">
              Reason: Student accounts on Tier 1 (Unverified) are limited to ₹10,000 per transaction to protect against unauthorized bulk agent usage.
            </div>
          </div>

          {/* Upgrade Path / Recovery Card */}
          <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white text-ai-violet border border-purple-200 mt-0.5">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-navy-900">
                  Unlock Tier 2 Student Limit (₹25,000)
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Verify your university student credentials with your .edu email or campus SSO to immediately elevate your daily spending cap.
                </p>
                <button className="mt-2 text-xs font-bold text-ai-violet hover:underline flex items-center gap-1">
                  Submit University Verification Proof <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2.5">
            <Link
              href="/cart"
              className="w-full py-3 px-4 rounded-xl bg-navy-900 text-white font-display font-bold text-xs uppercase tracking-wider hover:bg-ai-violet active:scale-98 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Cart to Adjust Items</span>
            </Link>

            <Link
              href="/merchant/policies"
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Review Policy Center Rules</span>
            </Link>
          </div>
        </div>
      </main>

      <BuyerFooter />
    </div>
  );
}

export default function TransactionBlockedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-500 font-mono-data text-xs">Loading governance policy check...</div>}>
      <TransactionBlockedContent />
    </Suspense>
  );
}

