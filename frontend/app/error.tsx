"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ShoppingBag, ArrowLeft } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception for debugging
    console.error("Kharridlo Client-Side Application Exception:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-sm">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 font-mono">
            Transaction Safety Checkpoint
          </span>
          <h2 className="text-xl font-extrabold text-navy-900 mt-1 font-display">
            Temporary Session Recovery
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            A temporary client state issue was encountered. Your cart items, selected options, and security state remain intact.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload View</span>
          </button>
          <Link
            href="/cart"
            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Back to Cart</span>
          </Link>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Marketplace Home
          </Link>
        </div>
      </div>
    </div>
  );
}
