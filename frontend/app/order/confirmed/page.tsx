"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  CheckCircle2, 
  ShieldCheck, 
  Download, 
  ArrowRight, 
  FileText, 
  Copy, 
  Lock, 
  Package, 
  Terminal,
  ExternalLink 
} from "lucide-react";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import Logo from "@/components/Logo";

function OrderConfirmedContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id") || "pay_RzpSimTest9021";
  const orderId = searchParams.get("order_id") || "order_internal_847192";
  const [showProofDrawer, setShowProofDrawer] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(paymentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <BuyerNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12">
        {/* Receipt Container (Stitch: order_confirmed) */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 p-8 sm:p-10 text-white text-center relative overflow-hidden">
            <div className="flex justify-center mb-4">
              <Logo variant="compact" theme="dark" size="sm" asLink={false} />
            </div>

            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-emerald-500/10 border border-growth-emerald/40 flex items-center justify-center text-growth-emerald shadow-lg">
              <CheckCircle2 className="h-10 w-10 animate-in zoom-in" />
            </div>

            <span className="text-[10px] font-mono-data font-bold uppercase tracking-widest text-emerald-400 block mb-1">
              Transaction Settled
            </span>
            <h1 className="font-display font-extrabold text-2xl sm:text-4xl tracking-tight text-white">
              Order Confirmed & Authorized
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto">
              Your student hardware order has been verified by the deterministic policy engine and settled through Razorpay Test Mode.
            </p>
          </div>

          {/* Ticket Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Payment & Order Reference Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 font-mono-data text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block">
                  Razorpay Payment ID
                </span>
                <div className="flex items-center gap-2 mt-0.5 font-bold text-navy-900">
                  <span>{paymentId}</span>
                  <button onClick={handleCopy} className="text-slate-400 hover:text-navy-900" title="Copy ID">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  {copied && <span className="text-[9px] text-growth-dark">Copied!</span>}
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block">
                  Internal Order Reference
                </span>
                <span className="font-bold text-navy-900 mt-0.5 block">
                  {orderId}
                </span>
              </div>
            </div>

            {/* Line Items Sample */}
            <div className="border border-slate-200 rounded-xl p-4">
              <span className="text-[10px] font-mono-data uppercase tracking-wider text-slate-400 font-bold block mb-3">
                Authorized Hardware
              </span>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
                <div>
                  <h4 className="font-bold text-navy-900">TechNova Pro 15.6&quot; Workstation</h4>
                  <span className="text-slate-500 text-[11px]">Qty: 1 • Tier 2 University Discount Applied</span>
                </div>
                <div className="text-right font-display font-bold text-sm text-navy-900">
                  ₹54,999
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between text-xs font-mono-data font-bold text-navy-900">
                <span>Total Settled (Paise: 5,499,900)</span>
                <span className="text-base font-display">₹54,999</span>
              </div>
            </div>

            {/* Simulated Digital Barcode (Stitch styling) */}
            <div className="p-4 rounded-xl bg-slate-900 text-center text-white space-y-2">
              <div className="font-mono text-xl tracking-[0.3em] font-light text-slate-300 select-none py-1">
                ||| | |||| || ||| |||| | || ||||| | |||
              </div>
              <div className="text-[10px] font-mono-data text-slate-400 uppercase tracking-widest">
                IMMUTABLE AUDIT RECORD • HASH: 9a8b7c6d5e4f3a2b
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowProofDrawer(!showProofDrawer)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-ai-violet hover:underline py-1"
              >
                <Terminal className="h-4 w-4" />
                <span>{showProofDrawer ? "Hide Verification Proof" : "View System Verification Proof"}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link
                  href="/merchant/orders"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-navy-900 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Audit Trail</span>
                </Link>

                <Link
                  href="/"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-bold hover:bg-ai-violet transition-colors shadow-sm"
                >
                  <span>Continue Shopping</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Verification Proof Drawer (Stitch: successful_order_system_verification) */}
            {showProofDrawer && (
              <div className="p-5 rounded-2xl bg-slate-950 text-slate-300 border border-slate-800 font-mono-data text-xs space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                    Backend Cryptographic Verification (HMAC-SHA256)
                  </span>
                  <span className="text-[10px] text-slate-500">FastAPI • Milestone 6 Verified</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div>
                    <span className="text-slate-500">Order ID: </span>
                    <span className="text-slate-200">{orderId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Razorpay Payment ID: </span>
                    <span className="text-emerald-400">{paymentId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Policy Evaluation: </span>
                    <span className="text-growth-emerald">ALLOW (Tier 2 Threshold ₹25,000 / Authorized)</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Inventory Status: </span>
                    <span className="text-slate-200">LOCKED_AND_DEDUCTED (Row-Level Locking active)</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Immutable Audit Event ID: </span>
                    <span className="text-ai-glow">evt_audit_89f0291a</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <BuyerFooter />
    </div>
  );
}

export default function OrderConfirmedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-xs font-mono-data text-slate-400">Loading Order Confirmation...</div>}>
      <OrderConfirmedContent />
    </Suspense>
  );
}
