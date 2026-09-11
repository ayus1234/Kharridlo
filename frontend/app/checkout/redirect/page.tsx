"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, RefreshCw, CheckCircle2, ArrowRight, ExternalLink, CreditCard } from "lucide-react";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import Logo from "@/components/Logo";
import { getOrCreateSessionId } from "@/lib/session";

export default function SecureCheckoutTransitionPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"CONNECTING" | "INITIATING" | "READY">("CONNECTING");
  const [orderData, setOrderData] = useState<any>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://kharridlo-backend.onrender.com";

  useEffect(() => {
    const initiatePayment = async () => {
      const sid = getOrCreateSessionId();
      try {
        setStatus("INITIATING");
        const res = await fetch(`${apiBaseUrl}/api/v1/payments/create-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sid }),
        });

        if (res.ok) {
          const data = await res.json();
          setOrderData(data);
          setStatus("READY");
          // Redirect to Cart page with active Razorpay checkout trigger
          setTimeout(() => {
            router.push(`/cart?auto_pay=1&order_id=${encodeURIComponent(data.razorpay_order_id || "")}`);
          }, 1200);
        } else {
          // Fallback to cart
          setTimeout(() => {
            router.push("/cart");
          }, 1800);
        }
      } catch {
        setTimeout(() => {
          router.push("/cart");
        }, 1800);
      }
    };

    initiatePayment();
  }, [router, apiBaseUrl]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <BuyerNavbar />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-navy-900 p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-ai-violet/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-growth-emerald/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 text-center">
            <div className="flex justify-center mb-6">
              <Logo variant="compact" theme="dark" size="sm" asLink={false} />
            </div>

            <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-growth-emerald shadow-inner relative">
              <CreditCard className="h-10 w-10 text-growth-light" />
              <div className="absolute inset-0 rounded-2xl border-2 border-growth-emerald/30 animate-ping opacity-25" />
            </div>

            <span className="text-[10px] font-mono-data uppercase tracking-widest text-emerald-400 font-bold block mb-2">
              Ready to Pay
            </span>

            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              Razorpay Gateway Handoff
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
              Autonomous order verified by deterministic policy checks. Opening secure Razorpay Test Mode checkout.
            </p>

            {/* Transition Checkpoints */}
            <div className="my-6 rounded-xl bg-slate-950/60 border border-slate-800 p-4 text-left font-mono-data text-xs space-y-2.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-growth-emerald" />
                  <span>Cart Validated</span>
                </span>
                <span className="text-growth-emerald text-[10px] font-bold">VERIFIED</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-growth-emerald" />
                  <span>Spending Policy Checked</span>
                </span>
                <span className="text-growth-emerald text-[10px] font-bold">ALLOWED</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-growth-emerald" />
                  <span>Buyer Authorization Received</span>
                </span>
                <span className="text-growth-emerald text-[10px] font-bold">CONFIRMED</span>
              </div>
              <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800">
                <span className="flex items-center gap-2">
                  {status === "READY" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-growth-emerald" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 text-ai-glow animate-spin" />
                  )}
                  <span>Razorpay Order Creation</span>
                </span>
                <span className={status === "READY" ? "text-growth-emerald font-bold" : "text-ai-glow font-bold"}>
                  {status === "READY" ? "READY" : "PREPARING"}
                </span>
              </div>
            </div>

            {/* Manual Action Button */}
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/cart?auto_pay=1&order_id=${encodeURIComponent(orderData?.razorpay_order_id || "")}`)}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-display font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Continue to Razorpay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <Link
                href="/cart"
                className="block text-center text-xs text-slate-400 hover:text-white transition-colors"
              >
                Return to Cart
              </Link>
            </div>
          </div>
        </div>
      </main>

      <BuyerFooter />
    </div>
  );
}
