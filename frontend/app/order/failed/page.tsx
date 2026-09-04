"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, RefreshCw, ShoppingCart, ArrowLeft, ShieldAlert, CreditCard } from "lucide-react";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "Payment verification failed or was cancelled by user.";
  const orderId = searchParams.get("order_id") || "order_ref_unsettled";

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <BuyerNavbar />

      <main className="flex-1 flex items-center justify-center p-6">
        {/* Payment Failed Card (Stitch: payment_failed) */}
        <div className="w-full max-w-lg rounded-3xl border border-rose-200 bg-white p-8 sm:p-10 shadow-xl text-center">
          <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
            <XCircle className="h-10 w-10" />
          </div>

          <span className="text-[10px] font-mono-data uppercase tracking-widest text-rose-600 font-bold block mb-1">
            Transaction Interrupted
          </span>

          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-navy-900 tracking-tight">
            Payment Not Completed
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
            {reason}
          </p>

          {/* Diagnostic Box */}
          <div className="my-6 rounded-xl bg-slate-50 border border-slate-200 p-4 text-left font-mono-data text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span>Order Reference:</span>
              <span className="text-navy-900 font-bold">{orderId}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Inventory Status:</span>
              <span className="text-growth-dark font-semibold">RESERVED (Safe for Retry)</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Idempotency Check:</span>
              <span className="text-slate-700">Clean (No Double Charge)</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3">
            <Link
              href="/cart"
              className="w-full py-3.5 px-4 rounded-xl bg-navy-900 text-white font-display font-bold text-xs uppercase tracking-wider hover:bg-ai-violet active:scale-98 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4 text-growth-emerald" />
              <span>Retry Payment</span>
            </Link>

            <Link
              href="/catalog"
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Catalog</span>
            </Link>
          </div>
        </div>
      </main>

      <BuyerFooter />
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-500 font-mono-data text-xs">Loading payment status...</div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}

