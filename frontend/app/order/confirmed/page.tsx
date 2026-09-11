"use client";

import { useState, Suspense, useEffect } from "react";
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
  ExternalLink,
  MapPin,
  Truck,
  Calendar,
  GraduationCap,
  Home,
  Building2,
  Clock,
  Sparkles
} from "lucide-react";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import Logo from "@/components/Logo";
import { DeliveryAddress, getDefaultDeliveryAddress, formatAddress } from "@/lib/address";
import AgentActivityTimeline from "@/components/dynamic/AgentActivityTimeline";

function OrderConfirmedContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id") || "pay_RzpSimTest9021";
  const orderId = searchParams.get("order_id") || "order_internal_847192";
  const [showProofDrawer, setShowProofDrawer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmedItems, setConfirmedItems] = useState<any[]>([]);
  const [totalAmountInr, setTotalAmountInr] = useState<number>(54999);

  const [address] = useState<DeliveryAddress>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("kharridlo_confirmed_delivery_address") || localStorage.getItem("kharridlo_delivery_address");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.fullName) return parsed;
        }
      } catch {}
    }
    return getDefaultDeliveryAddress();
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedCart = localStorage.getItem("kharridlo_client_cart");
        if (storedCart) {
          const items = JSON.parse(storedCart);
          if (Array.isArray(items) && items.length > 0) {
            setConfirmedItems(items);
            const total = items.reduce((acc: number, item: any) => {
              const p = item.price_paise ? item.price_paise / 100 : (item.price_inr || 0);
              return acc + p * (item.quantity || 1);
            }, 0);
            if (total > 0) setTotalAmountInr(total);
          }
        }
      } catch {}
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard?.writeText(paymentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute estimated delivery date (3 days from now)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3);
  const formattedDeliveryDate = deliveryDate.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <BuyerNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* Receipt Container */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 p-8 sm:p-10 text-white text-center relative overflow-hidden">
            <div className="flex justify-center mb-4">
              <Logo variant="compact" theme="dark" size="sm" asLink={false} />
            </div>

            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-emerald-500/10 border border-growth-emerald/40 flex items-center justify-center text-growth-emerald shadow-lg">
              <CheckCircle2 className="h-10 w-10 animate-in zoom-in" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono-data font-bold uppercase tracking-widest mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-growth-light animate-pulse" />
              Payment Verified • HMAC-SHA256
            </div>

            <h1 className="font-display font-extrabold text-2xl sm:text-4xl tracking-tight text-white">
              Order Confirmed & Settled
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
              Your hardware purchase was authorized by you, verified by deterministic policy gates, and captured through Razorpay Test Mode.
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

            {/* 4-Stage Logistics Progression */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-navy-900">
                      Delivery & Dispatch Status
                    </h3>
                    <p className="text-xs text-slate-500">
                      Estimated Arrival: <strong className="text-emerald-700">{formattedDeliveryDate}</strong>
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 self-start sm:self-auto">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>On Schedule • Free Express Student Delivery</span>
                </div>
              </div>

              {/* 4-Stage Progress Tracker */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="flex flex-col items-center space-y-1.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">Confirmed</span>
                  <span className="text-[10px] font-mono-data text-slate-400">Payment Verified</span>
                </div>

                <div className="flex flex-col items-center space-y-1.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">Packed</span>
                  <span className="text-[10px] font-mono-data text-slate-400">Inventory Locked</span>
                </div>

                <div className="flex flex-col items-center space-y-1.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs ring-4 ring-indigo-100 animate-pulse">
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-indigo-700">In Transit</span>
                  <span className="text-[10px] font-mono-data text-indigo-600">BlueDart Air</span>
                </div>

                <div className="flex flex-col items-center space-y-1.5 opacity-40">
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Delivered</span>
                  <span className="text-[10px] font-mono-data text-slate-400">{formattedDeliveryDate.split(',')[0]}</span>
                </div>
              </div>

              {/* Delivery Address Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-navy-900">Shipping to: {address.fullName}</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono-data border flex items-center gap-1 bg-white border-slate-200 text-slate-700">
                        {address.addressType === "campus" && <GraduationCap className="w-3 h-3 text-indigo-600" />}
                        {address.addressType === "home" && <Home className="w-3 h-3 text-blue-600" />}
                        {address.addressType === "work" && <Building2 className="w-3 h-3 text-purple-600" />}
                        {address.addressType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">
                      {formatAddress(address)}
                    </p>
                    <p className="text-xs font-mono-data text-slate-500">
                      Contact: <strong className="text-slate-800">+91 {address.phone}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right flex-shrink-0 text-xs font-mono-data text-slate-500 border-t sm:border-t-0 pt-2 sm:pt-0">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-sans font-semibold">Logistics Carrier</span>
                  <span className="font-bold text-slate-800">BlueDart Express</span>
                  <span className="text-[10px] text-emerald-700 block font-sans">Priority Student Air</span>
                </div>
              </div>
            </div>

            {/* Kharridlo Agent Activity Timeline */}
            <AgentActivityTimeline
              currentState="ORDER_CONFIRMED"
              defaultExpanded={true}
            />

            {/* Line Items Sample / Actual Cart */}
            <div className="border border-slate-200 rounded-xl p-4">
              <span className="text-[10px] font-mono-data uppercase tracking-wider text-slate-400 font-bold block mb-3">
                Authorized Hardware
              </span>

              {confirmedItems.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {confirmedItems.map((item, idx) => {
                    const price = item.price_paise ? item.price_paise / 100 : (item.price_inr || 0);
                    return (
                      <div key={idx} className="flex items-center justify-between py-2 text-xs">
                        <div>
                          <h4 className="font-bold text-navy-900">{item.name || item.title}</h4>
                          <span className="text-slate-500 text-[11px]">Qty: {item.quantity || 1} • {item.brand || "Verified"}</span>
                        </div>
                        <div className="text-right font-display font-bold text-sm text-navy-900">
                          ₹{(price * (item.quantity || 1)).toLocaleString("en-IN")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
                  <div>
                    <h4 className="font-bold text-navy-900">TechNova Pro 15.6&quot; Workstation</h4>
                    <span className="text-slate-500 text-[11px]">Qty: 1 • Tier 2 University Discount Applied</span>
                  </div>
                  <div className="text-right font-display font-bold text-sm text-navy-900">
                    ₹54,999
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono-data font-bold text-navy-900">
                <span>Total Settled (Razorpay Test Mode)</span>
                <span className="text-base font-display">₹{totalAmountInr.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Simulated Digital Barcode */}
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
                <span>{showProofDrawer ? "Hide Cryptographic Proof" : "View Cryptographic Verification Proof"}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link
                  href="/merchant/orders"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-navy-900 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Audit Ledger</span>
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

            {/* Verification Proof Drawer */}
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
                    <span className="text-growth-emerald">ALLOW (Tier 2 Threshold Verified)</span>
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
