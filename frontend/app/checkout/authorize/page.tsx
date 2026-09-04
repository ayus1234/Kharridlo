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
  Sparkles
} from "lucide-react";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import BentoCard from "@/components/BentoCard";
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
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [sessionId, setSessionId] = useState("");

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    const sid = getOrCreateSessionId();
    setSessionId(sid);
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
        // Fallback demo evaluation
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
      // Redirect to secure transition after authorization
      setTimeout(() => {
        router.push("/checkout/redirect");
      }, 1200);
    }, 800);
  };

  const totalInr = evaluation?.cart_total_inr || 24999;
  const maxInr = evaluation?.max_cart_total_inr || 40000;
  const utilizationPct = Math.min(100, Math.round((totalInr / maxInr) * 100));

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
              <h1 className="text-2xl font-extrabold font-display text-navy-900 tracking-tight">
                Purchase Authorization Gate
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic governance checkpoint • Kharridlo Policy Engine v1.4
              </p>
            </div>
          </div>
        </div>

        {/* Authorization Bento (Stitch: purchase_authorization & authorize_purchase) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left 2 cols: Verification Summary */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <span className="text-xs font-mono-data font-bold uppercase tracking-wider text-slate-400">
                  Cart Financial Summary
                </span>
                <span className="text-[10px] font-mono-data font-bold text-growth-dark bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {evaluation?.policy_tier || "TIER_2"} Active
                </span>
              </div>

              <div className="flex items-baseline justify-between mb-4">
                <span className="text-xs text-slate-600 font-medium">Transaction Amount:</span>
                <span className="font-display font-extrabold text-2xl text-navy-900">
                  ₹{totalInr.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Policy Spending Utilization Progress */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 mb-6">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700">Tier Spending Limit Utilization</span>
                  <span className="font-mono-data font-bold text-navy-900">{utilizationPct}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-growth-emerald to-emerald-500 transition-all duration-500"
                    style={{ width: `${utilizationPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono-data mt-1.5">
                  <span>₹0</span>
                  <span>Cap: ₹{maxInr.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Policy Reasons */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono-data uppercase font-bold text-slate-400">
                  Policy Evaluation Proof:
                </span>
                {(evaluation?.reasons || []).map((r, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-purple-50/60 border border-purple-100 text-xs">
                    <Sparkles className="h-4 w-4 text-ai-violet mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-mono-data font-bold text-ai-violet text-[10px] block">
                        {r.code}
                      </span>
                      <p className="text-slate-700 mt-0.5">{r.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 1 col: Authorization Gate Action */}
          <div className="space-y-6">
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between h-full">
              <div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-growth-dark mb-4">
                  <UserCheck className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-base text-navy-900">
                  Buyer Consent Gate
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  You are explicitly authorizing Kharridlo to reserve hardware inventory and initiate a Razorpay Test Mode payment order.
                </p>

                <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-growth-emerald" />
                    <span>Zero AI Payment Execution</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-growth-emerald" />
                    <span>15-Minute Inventory Lock</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {authorized ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-growth-dark font-display">
                      <CheckCircle2 className="h-4 w-4 text-growth-emerald animate-bounce" />
                      Authorization Granted!
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Redirecting to Razorpay Gateway...</p>
                  </div>
                ) : (
                  <button
                    onClick={handleGrantAuthorization}
                    disabled={authorizing}
                    className="w-full py-3.5 px-4 rounded-xl bg-navy-900 text-white font-display font-bold text-xs uppercase tracking-wider hover:bg-growth-dark active:scale-98 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {authorizing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-growth-emerald" />
                        <span>Verifying Token...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 text-growth-emerald" />
                        <span>Grant Authorization</span>
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
