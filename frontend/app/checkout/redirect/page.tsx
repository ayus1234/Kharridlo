"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, RefreshCw, CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import Logo from "@/components/Logo";
import { getOrCreateSessionId } from "@/lib/session";

export default function SecureCheckoutTransitionPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"CONNECTING" | "INITIATING" | "READY">("CONNECTING");
  const [orderData, setOrderData] = useState<any>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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
          }, 1500);
        } else {
          // Fallback to cart
          setTimeout(() => {
            router.push("/cart");
          }, 2000);
        }
      } catch {
        setTimeout(() => {
          router.push("/cart");
        }, 2000);
      }
    };

    initiatePayment();
  }, [router, apiBaseUrl]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <BuyerNavbar />

      <main className="flex-1 flex items-center justify-center p-6">
        {/* Secure Checkout Transition Card (Stitch: secure_checkout_transition) */}
        <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-navy-900 p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-ai-violet/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-growth-emerald/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 text-center">
            {/* Brand Logo */}
            <div className="flex justify-center mb-6">
              <Logo variant="compact" theme="dark" size="sm" asLink={false} />
            </div>

            {/* Animated Shield Container */}
            <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-growth-emerald shadow-inner relative">
              <ShieldCheck className="h-10 w-10 animate-pulse" />
              <div className="absolute inset-0 rounded-2xl border-2 border-growth-emerald/30 animate-ping opacity-25" />
            </div>

            <span className="text-[10px] font-mono-data uppercase tracking-widest text-emerald-400 font-bold block mb-2">
              Encrypted Handoff
            </span>

            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              Secure Checkout Transition
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
              Transitioning to Razorpay Gateway under verified buyer authorization. Zero AI payment authority.
            </p>

            {/* Transition Progress Indicators */}
            <div className="my-8 rounded-xl bg-slate-950/60 border border-slate-800 p-4 text-left font-mono-data text-xs space-y-2.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-growth-emerald" />
                  <span>Deterministic Policy Check</span>
                </span>
                <span className="text-growth-emerald text-[10px] font-bold">PASSED</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-growth-emerald" />
                  <span>Buyer Authorization Signature</span>
                </span>
                <span className="text-growth-emerald text-[10px] font-bold">VERIFIED</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  {status === "READY" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-growth-emerald" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 text-ai-glow animate-spin" />
                  )}
                  <span>Razorpay Order Creation</span>
                </span>
                <span className={status === "READY" ? "text-growth-emerald font-bold" : "text-ai-glow"}>
                  {status === "READY" ? "CREATED" : "IN PROGRESS"}
                </span>
              </div>
            </div>

            {/* Return Link */}
            <div className="pt-2">
              <Link
                href="/cart"
                className="text-xs text-slate-400 hover:text-white transition-colors"
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
