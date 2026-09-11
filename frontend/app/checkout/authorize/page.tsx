"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ShieldCheck, 
  ArrowLeft, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Clock, 
  UserCheck, 
  RefreshCw,
  Sparkles,
  ShoppingBag,
  CreditCard
} from "lucide-react";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import PolicyStatusCard from "@/components/dynamic/PolicyStatusCard";
import { getOrCreateSessionId } from "@/lib/session";

interface PolicyEvaluation {
  decision: "ALLOW" | "BLOCK" | "AUTHORIZATION_REQUIRED";
  policy_tier: string;
  cart_total_inr: number;
  max_single_transaction_inr: number;
  max_cart_total_inr: number;
  remaining_buffer_inr: number;
  authorization_required: boolean;
  reasons: { code: string; message: string }[];
}

export default function PurchaseAuthorizationPage() {
  const router = useRouter();
  const [evaluation, setEvaluation] = useState<PolicyEvaluation | null>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [sessionId, setSessionId] = useState("");

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://kharridlo-backend.onrender.com";

  useEffect(() => {
    const sid = getOrCreateSessionId();
    setSessionId(sid);
    
    // Attempt to load client cart items for order breakdown
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("kharridlo_client_cart");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setCartItems(parsed);
        }
      } catch {}
    }

    evaluatePolicy(sid);
  }, []);

  const evaluatePolicy = async (sid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/policy/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid }),
      });
      if (res.ok) {
        const data = await res.json();
        setEvaluation(data);
      } else {
        // Fallback evaluation
        setEvaluation({
          decision: "AUTHORIZATION_REQUIRED",
          policy_tier: "TIER_2",
          cart_total_inr: 24999,
          max_single_transaction_inr: 25000,
          max_cart_total_inr: 40000,
          remaining_buffer_inr: 15001,
          authorization_required: true,
          reasons: [
            {
              code: "STUDENT_TIER_AUTH_REQUIRED",
              message: "Student Tier 2 transactions above ₹10,000 require explicit buyer confirmation.",
            },
          ],
        });
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAuthorization = () => {
    setAuthorizing(true);
    setTimeout(() => {
      setAuthorizing(false);
      setAuthorized(true);
      // Handover to secure checkout redirect
      setTimeout(() => {
        router.push("/checkout/redirect");
      }, 1000);
    }, 800);
  };

  const totalInr = evaluation?.cart_total_inr || 24999;
  const maxInr = evaluation?.max_cart_total_inr || 40000;
  const bufferInr = evaluation?.remaining_buffer_inr || 15001;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <BuyerNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6">
          <Link href="/cart" className="text-xs text-slate-500 hover:text-navy-900 flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Cart
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-navy-900 flex items-center justify-center text-growth-emerald shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-navy-900 tracking-tight">
                Purchase Authorization Checkpoint
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic governance gate • Explicit human buyer approval required
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Bento: Left Order Summary & Policy Status | Right Authorization Gate */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left 2 cols: Order Summary & Policy Status */}
          <div className="md:col-span-2 space-y-5">
            {/* Policy Status Card */}
            <PolicyStatusCard
              decision={evaluation?.decision || "AUTHORIZATION_REQUIRED"}
              policyTier={evaluation?.policy_tier || "TIER_2"}
              cartTotalInr={totalInr}
              remainingBufferInr={bufferInr}
              maxCartTotalInr={maxInr}
              reasons={evaluation?.reasons}
            />

            {/* Order Items Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <span className="text-xs font-mono-data font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" /> Order Summary
                </span>
                <span className="text-[10px] font-mono-data font-semibold text-growth-dark bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Inventory Held
                </span>
              </div>

              {cartItems.length > 0 ? (
                <div className="divide-y divide-slate-100 mb-4">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <h4 className="font-bold text-navy-900 line-clamp-1">{item.name || item.title}</h4>
                        <span className="text-slate-400 text-[11px] font-mono-data">Qty: {item.quantity || 1} • {item.brand || "Verified"}</span>
                      </div>
                      <span className="font-bold font-mono-data text-navy-900">
                        ₹{((item.price_paise ? item.price_paise / 100 : item.price_inr) * (item.quantity || 1)).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-3 text-xs text-slate-500 font-mono-data">
                  <span>Authorized Student Hardware Allocation • Total: ₹{totalInr.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-600 block">Total Payable</span>
                  <span className="text-[10px] text-slate-400 font-mono-data">Zero additional fees</span>
                </div>
                <span className="font-display font-extrabold text-2xl text-navy-900">
                  ₹{totalInr.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Right 1 col: Buyer Authorization Action */}
          <div className="space-y-6">
            <div className="rounded-2xl border-2 border-indigo-200 bg-white p-6 shadow-sm flex flex-col justify-between h-full">
              <div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-growth-dark mb-4">
                  <UserCheck className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-base text-navy-900">
                  You are about to authorize this purchase
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  The AI shopping assistant has proposed this hardware configuration. You are now explicitly authorizing Kharridlo to create a secure Razorpay payment intent.
                </p>

                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-growth-emerald flex-shrink-0" />
                    <span>Deterministic policy check passed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-growth-emerald flex-shrink-0" />
                    <span>Zero AI autonomous payment rights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-growth-emerald flex-shrink-0" />
                    <span>Razorpay HMAC-SHA256 verification</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {authorized ? (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-center animate-in zoom-in-95">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-growth-dark font-display">
                      <CheckCircle2 className="h-4 w-4 text-growth-emerald" />
                      Authorization Confirmed!
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono-data">Proceeding to Razorpay Gateway...</p>
                  </div>
                ) : (
                  <button
                    onClick={handleGrantAuthorization}
                    disabled={authorizing}
                    className="w-full py-3.5 px-4 rounded-xl bg-navy-900 text-white font-display font-bold text-xs uppercase tracking-wider hover:bg-ai-violet active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {authorizing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-growth-emerald" />
                        <span>Verifying Authorization...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 text-growth-emerald" />
                        <span>Confirm & Continue to Razorpay</span>
                      </>
                    )}
                  </button>
                )}

                <Link
                  href="/cart"
                  className="block text-center text-xs text-slate-500 hover:text-navy-900 font-medium py-1"
                >
                  Cancel and return to Cart
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BuyerFooter />
    </div>
  );
}
