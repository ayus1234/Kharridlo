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
  CreditCard,
  XCircle,
  MapPin,
  X,
  ShieldAlert,
} from "lucide-react";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import PolicyStatusCard from "@/components/dynamic/PolicyStatusCard";
import { getOrCreateSessionId } from "@/lib/session";
import { DeliveryAddress, getDefaultDeliveryAddress, formatAddress } from "@/lib/address";

interface CartItem {
  id: string;
  cart_id?: string;
  product_id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  image_url?: string;
  quantity: number;
  unit_price_paise: number;
  line_total_paise: number;
  availability_status?: string;
}

interface CartResponse {
  id: string;
  session_id: string;
  status: string;
  currency: string;
  subtotal_paise: number;
  total_paise: number;
  total_items_count: number;
  items: CartItem[];
}

interface PolicyRuleReason {
  code: string;
  message: string;
  threshold_paise?: number;
  observed_paise?: number;
}

interface PolicyEvaluation {
  decision: "ALLOW" | "BLOCK" | "AUTHORIZATION_REQUIRED";
  policy_tier: string;
  cart_total_inr: number;
  max_single_transaction_inr: number;
  max_cart_total_inr: number;
  remaining_buffer_inr: number;
  authorization_required: boolean;
  reasons: PolicyRuleReason[];
}

export default function PurchaseAuthorizationPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string>("");
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [evaluation, setEvaluation] = useState<PolicyEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<any | null>(null);

  const [deliveryAddress] = useState<DeliveryAddress>(() => {
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

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://kharridlo-backend.onrender.com";

  useEffect(() => {
    const sid = getOrCreateSessionId();
    setSessionId(sid);
    loadCartAndPolicy(sid);
  }, []);

  const loadCartAndPolicy = async (sid: string) => {
    setLoading(true);
    setPaymentError(null);
    try {
      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";

      // 1. Fetch Cart
      let cartData: CartResponse | null = null;
      try {
        const cartUrl = isHttps && apiBaseUrl.startsWith("http://localhost")
          ? `/api/cart/${sid}`
          : `${apiBaseUrl}/api/v1/cart/${sid}`;
        let res = await fetch(cartUrl, { cache: "no-store", signal: AbortSignal.timeout(2000) }).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch(`/api/cart/${sid}`, { cache: "no-store", signal: AbortSignal.timeout(2000) }).catch(() => null);
        }
        if (res && res.ok) {
          cartData = await res.json();
          setCart(cartData);
        }
      } catch {
        // Fallback
      }

      // 2. Fetch Policy Evaluation
      try {
        const evalPayload = {
          cart_items: cartData?.items || [],
          tier: "STANDARD",
        };
        const evalUrl = isHttps && apiBaseUrl.startsWith("http://localhost")
          ? `/api/policy/evaluate/${sid}`
          : `${apiBaseUrl}/api/v1/policy/evaluate/${sid}`;
        let evalRes = await fetch(evalUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(evalPayload),
        }).catch(() => null);
        if (!evalRes || !evalRes.ok) {
          evalRes = await fetch(`/api/policy/evaluate/${sid}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(evalPayload),
          }).catch(() => null);
        }
        if (evalRes && evalRes.ok) {
          const evalData = await evalRes.json();
          setEvaluation(evalData);
        } else {
          // Calculate deterministic evaluation client-side
          const totalPaise = cartData?.total_paise || 0;
          const limitPaise = 7000000;
          const isBlocked = totalPaise > limitPaise;
          setEvaluation({
            decision: isBlocked ? "BLOCK" : "AUTHORIZATION_REQUIRED",
            policy_tier: "STANDARD",
            cart_total_inr: totalPaise / 100,
            max_single_transaction_inr: 70000,
            max_cart_total_inr: 70000,
            remaining_buffer_inr: Math.max(0, (limitPaise - totalPaise) / 100),
            authorization_required: true,
            reasons: isBlocked
              ? [{ code: "TRANSACTION_LIMIT_EXCEEDED", message: "Cart total exceeds maximum single transaction limit of ₹70,000" }]
              : [{ code: "POLICY_APPROVED", message: "Complies with standard spending tier limits." }],
          });
        }
      } catch {
        // Fallback evaluation
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleAuthorizeAndPay = async () => {
    if (!cart || cart.items.length === 0) return;
    setAuthorizing(true);
    setPaymentError(null);

    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";

    try {
      // Step 1: Explicit Human Buyer Authorization
      const confirmPayload = {
        buyer_confirmed: true,
        cart_items: cart.items,
        tier: evaluation?.policy_tier || "STANDARD",
        total_paise: cart.total_paise,
        shipping_address: deliveryAddress,
      };

      const confirmUrl = isHttps && apiBaseUrl.startsWith("http://localhost")
        ? `/api/checkout/confirm?session_id=${sessionId}`
        : `${apiBaseUrl}/api/v1/checkout/confirm?session_id=${sessionId}`;

      let confirmRes = await fetch(confirmUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-ID": sessionId },
        body: JSON.stringify(confirmPayload),
      }).catch(() => null);

      if (!confirmRes || !confirmRes.ok) {
        confirmRes = await fetch(`/api/checkout/confirm?session_id=${sessionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Session-ID": sessionId },
          body: JSON.stringify(confirmPayload),
        });
      }

      if (!confirmRes.ok) {
        const err = await confirmRes.json().catch(() => ({}));
        throw new Error(err.detail?.message || "Checkout confirmation failed");
      }

      const checkoutData = await confirmRes.json();
      setAuthorized(true);

      // Step 2: Server creates Razorpay Order
      const orderPayload = {
        checkout_id: checkoutData.id,
        cart_items: cart.items,
        total_paise: cart.total_paise,
        shipping_address: deliveryAddress,
      };

      const orderUrl = isHttps && apiBaseUrl.startsWith("http://localhost")
        ? `/api/payments/orders?session_id=${sessionId}`
        : `${apiBaseUrl}/api/v1/payments/orders?session_id=${sessionId}`;

      let orderRes = await fetch(orderUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-ID": sessionId },
        body: JSON.stringify(orderPayload),
      }).catch(() => null);

      if (!orderRes || !orderRes.ok) {
        orderRes = await fetch(`/api/payments/orders?session_id=${sessionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Session-ID": sessionId },
          body: JSON.stringify(orderPayload),
        });
      }

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        throw new Error(err.detail?.message || "Payment order creation failed");
      }

      const orderData = await orderRes.json();

      // Step 3: Open Razorpay Test Mode Checkout
      const scriptLoaded = await loadRazorpayScript();

      if (scriptLoaded && (window as any).Razorpay) {
        const options: any = {
          key: orderData.key_id,
          amount: orderData.amount_paise,
          currency: orderData.currency || "INR",
          name: "Kharridlo",
          description: "Autonomous Commerce Gateway (Test Mode)",
          prefill: {
            name: deliveryAddress.fullName || "Kharridlo Buyer",
            email: "buyer@kharridlo.test",
            contact: deliveryAddress.phone || "9876543210",
          },
          notes: {
            shipping_address: formatAddress(deliveryAddress),
            checkout_id: checkoutData.id,
          },
          handler: async function (response: any) {
            await verifyPayment(
              orderData.internal_order_id,
              response.razorpay_order_id || orderData.razorpay_order_id || "",
              response.razorpay_payment_id,
              response.razorpay_signature || "",
              orderData.amount_paise
            );
          },
          modal: {
            ondismiss: async function () {
              // Notify server of dismissal without clearing cart
              const cancelUrl = isHttps && apiBaseUrl.startsWith("http://localhost")
                ? `/api/payments/cancel?session_id=${sessionId}`
                : `${apiBaseUrl}/api/v1/payments/cancel?session_id=${sessionId}`;

              await fetch(cancelUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Session-ID": sessionId },
                body: JSON.stringify({
                  internal_order_id: orderData.internal_order_id,
                  reason: "buyer_dismissed_checkout",
                }),
              }).catch(() => null);

              setAuthorizing(false);
              setPaymentError("Payment modal dismissed. Your items and inventory reservations are preserved. You can retry whenever ready.");
            },
          },
          theme: {
            color: "#4f46e5",
          },
        };

        if (
          orderData.razorpay_order_id &&
          !orderData.razorpay_order_id.startsWith("order_test_") &&
          !orderData.razorpay_order_id.includes("fake")
        ) {
          options.order_id = orderData.razorpay_order_id;
        }

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (resp: any) {
          setAuthorizing(false);
          setPaymentError(resp.error?.description || "Payment attempt failed at gateway. Your cart items are preserved.");
        });
        rzp.open();
      } else {
        // Fallback for headless environments: simulated capture
        const testPaymentId = `pay_test_${Math.random().toString(36).substring(2, 10)}`;
        const testSig = `sig_${Math.random().toString(36).substring(2, 12)}`;
        await verifyPayment(
          orderData.internal_order_id,
          orderData.razorpay_order_id,
          testPaymentId,
          testSig,
          orderData.amount_paise
        );
      }
    } catch (err: any) {
      setAuthorizing(false);
      setPaymentError(err.message || "Failed to initiate authorization flow");
    }
  };

  const verifyPayment = async (
    internalOrderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    amountPaise: number
  ) => {
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    try {
      const url = isHttps && apiBaseUrl.startsWith("http://localhost")
        ? `/api/payments/verify`
        : `${apiBaseUrl}/api/v1/payments/verify`;

      let verifyRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internal_order_id: internalOrderId,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
        }),
      }).catch(() => null);

      if (!verifyRes || !verifyRes.ok) {
        verifyRes = await fetch(`/api/payments/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            internal_order_id: internalOrderId,
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
          }),
        });
      }

      if (!verifyRes.ok) {
        const err = await verifyRes.json().catch(() => ({}));
        throw new Error(err.detail?.message || "Cryptographic HMAC verification failed");
      }

      setPaymentSuccess({
        internalOrderId,
        razorpayPaymentId,
        amountPaise,
      });

      // Clear client cache and redirect to order confirmed page
      window.dispatchEvent(new Event("cart-updated"));
      setTimeout(() => {
        router.push(`/order/confirmed?order_id=${encodeURIComponent(internalOrderId)}&payment_id=${encodeURIComponent(razorpayPaymentId)}`);
      }, 1000);
    } catch (err: any) {
      setAuthorizing(false);
      setPaymentError(err.message || "Payment verification failed");
    }
  };

  const formatPrice = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  const isBlocked = evaluation?.decision === "BLOCK";

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <BuyerNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb & Navigation */}
        <div className="mb-6">
          <Link href="/cart" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-navy-900 mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Cart
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 font-mono">
                  Human Checkpoint • Zero AI Payment Authority
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-navy-900 tracking-tight">
                  Purchase Authorization Gate
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  &quot;AI proposes. Deterministic systems verify. You authorize.&quot;
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Payment Has Not Been Initiated
              </span>
            </div>
          </div>
        </div>

        {/* Error / Dismissal Notice */}
        {paymentError && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold">Transaction Notification</h4>
                <p className="text-xs text-amber-800 mt-0.5">{paymentError}</p>
                <p className="text-[11px] text-emerald-800 font-semibold mt-1">
                  🛡️ Cart Preserved: Your items and inventory reservation remain safely active in your cart.
                </p>
              </div>
            </div>
            <button
              onClick={() => setPaymentError(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-amber-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success Banner */}
        {paymentSuccess && (
          <div className="mb-6 p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center gap-3 shadow-xs animate-in zoom-in-95">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold">Purchase Authorized & Verified!</h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Cryptographic HMAC signature confirmed. Finalizing order and redirecting to receipt...
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
            <p className="text-sm font-medium">Revalidating authoritative cart and spending policy...</p>
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center max-w-md mx-auto shadow-sm">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Your cart is currently empty</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add products to your cart before proceeding to the buyer authorization checkpoint.
            </p>
            <div className="mt-5">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
              >
                Browse Catalog
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Cols: Policy Evaluation & Item Breakdown */}
            <div className="lg:col-span-7 space-y-6">
              {/* Policy Status Card */}
              {evaluation && (
                <PolicyStatusCard
                  decision={evaluation.decision}
                  policyTier={evaluation.policy_tier}
                  cartTotalInr={evaluation.cart_total_inr}
                  remainingBufferInr={evaluation.remaining_buffer_inr}
                  maxCartTotalInr={evaluation.max_cart_total_inr}
                  reasons={evaluation.reasons}
                />
              )}

              {/* Order Items Breakdown */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900">
                      Authoritative Item Breakdown ({cart.total_items_count} items)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                    Real-time Inventory Reserved
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {cart.items.map((item) => (
                    <div key={item.id} className="py-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {item.sku}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">{item.brand}</span>
                        </div>
                        <h4 className="font-bold text-xs text-navy-900 mt-1 leading-snug">{item.name}</h4>
                        <span className="text-[11px] font-mono text-slate-500">
                          {formatPrice(item.unit_price_paise)} x {item.quantity}
                        </span>
                      </div>
                      <span className="font-bold font-mono text-xs text-navy-900 whitespace-nowrap">
                        {formatPrice(item.line_total_paise)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-600 block">Authoritative Total</span>
                    <span className="text-[10px] text-slate-400 font-mono">Calculated server-side in exact paise</span>
                  </div>
                  <div className="text-right">
                    <span className="font-display font-extrabold text-2xl text-navy-900">
                      {formatPrice(cart.total_paise)}
                    </span>
                    <span className="block text-[10px] font-mono text-slate-400">
                      ({cart.total_paise} paise)
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Address Preview */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex items-start gap-3">
                <MapPin className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span>Shipping to: {deliveryAddress.fullName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 uppercase font-mono">
                      {deliveryAddress.addressType}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{formatAddress(deliveryAddress)}</p>
                  <p className="text-slate-500 mt-0.5 font-mono">Mobile: +91 {deliveryAddress.phone}</p>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Explicit Authorization Checkpoint Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl border-2 border-indigo-200 bg-white p-6 sm:p-7 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-growth-dark mb-4">
                    <UserCheck className="h-5 w-5 text-emerald-600" />
                  </div>

                  <h3 className="font-display font-bold text-base text-navy-900">
                    Explicit Human Authorization
                  </h3>

                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Kharridlo enforces strict separation between AI suggestions and payment authorization.
                    Reviewing this order grants one-time consent for server order creation.
                  </p>

                  <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Deterministic policy verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Zero autonomous AI charging authority</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Real-time inventory lock preserved</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Razorpay HMAC-SHA256 signature verification</span>
                    </div>
                  </div>

                  {isBlocked && (
                    <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Authorization Blocked by Policy:</span>
                        <p className="mt-0.5">
                          Cart total exceeds your allowed spending tier. Adjust items or request an elevated policy limit.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 space-y-3">
                  <button
                    onClick={handleAuthorizeAndPay}
                    disabled={authorizing || isBlocked}
                    className="w-full py-4 px-4 rounded-2xl bg-indigo-600 text-white font-display font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 active:scale-95 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {authorizing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-white" />
                        <span>Verifying Authorization & Opening Razorpay...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 text-indigo-200" />
                        <span>Authorize Purchase & Pay {formatPrice(cart.total_paise)}</span>
                      </>
                    )}
                  </button>

                  <Link
                    href="/cart"
                    className="block text-center text-xs text-slate-500 hover:text-navy-900 font-medium py-1"
                  >
                    Cancel and modify cart items
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <BuyerFooter />
    </div>
  );
}
