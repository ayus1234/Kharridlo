"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  ShieldAlert, 
  Lock, 
  UserCheck,
  CreditCard,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { getOrCreateSessionId } from "@/lib/session";
import AIAssistantDrawer from "@/components/AIAssistantDrawer";
import Logo from "@/components/Logo";

interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  image_url?: string;
  quantity: number;
  unit_price_paise: number;
  unit_price_inr: number;
  line_total_paise: number;
  line_total_inr: number;
  availability_status: string;
}

interface CartResponse {
  id: string;
  session_id: string;
  status: string;
  currency: string;
  subtotal_paise: number;
  subtotal_inr: number;
  total_paise: number;
  total_inr: number;
  total_items_count: number;
  expires_at: string;
  is_expired: boolean;
  items: CartItem[];
}

interface PolicyRuleReason {
  code: string;
  message: string;
  threshold_paise?: number;
  observed_paise?: number;
}

interface PolicyEvaluationResponse {
  decision: "ALLOW" | "BLOCK" | "AUTHORIZATION_REQUIRED";
  policy_tier: string;
  session_id: string;
  cart_id?: string;
  cart_total_paise: number;
  cart_total_inr: number;
  max_single_transaction_paise: number;
  max_single_transaction_inr: number;
  max_cart_total_paise: number;
  max_cart_total_inr: number;
  remaining_buffer_paise: number;
  remaining_buffer_inr: number;
  authorization_required: boolean;
  payment_initiated: boolean;
  reasons: PolicyRuleReason[];
}

interface PolicyTierSummary {
  tier: string;
  name: string;
  max_single_transaction_paise: number;
  max_single_transaction_inr: number;
  max_cart_total_paise: number;
  max_cart_total_inr: number;
  authorization_required: boolean;
}

interface PaymentState {
  status: "IDLE" | "PROCESSING" | "SUCCESS" | "FAILED" | "CANCELLED" | "PENDING";
  internalOrderId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amountPaise?: number;
  error?: string;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [policyResult, setPolicyResult] = useState<PolicyEvaluationResponse | null>(null);
  const [evaluatingPolicy, setEvaluatingPolicy] = useState<boolean>(false);
  const [selectedTier, setSelectedTier] = useState<string>("STANDARD");
  const [availableTiers, setAvailableTiers] = useState<PolicyTierSummary[]>([]);
  const [buyerApproved, setBuyerApproved] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [paymentState, setPaymentState] = useState<PaymentState>({ status: "IDLE" });

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://kharridlo-backend.onrender.com";

  useEffect(() => {
    const sid = getOrCreateSessionId();
    setSessionId(sid);
    fetchCart(sid);
    fetchPolicyTiers();
  }, []);

  const fetchPolicyTiers = async () => {
    try {
      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
      const url = (isHttps && apiBaseUrl.startsWith("http://localhost"))
        ? `/api/policy/tiers`
        : `${apiBaseUrl}/api/v1/policy/tiers`;
      let res: Response | null = null;
      try {
        res = await fetch(url, { cache: "no-store" });
      } catch {
        res = await fetch(`/api/policy/tiers`, { cache: "no-store" });
      }
      if (res && res.ok) {
        const tiers: PolicyTierSummary[] = await res.json();
        setAvailableTiers(tiers);
      }
    } catch {
      // Graceful fallback
    }
  };

  const startNewSession = () => {
    if (typeof window !== "undefined") {
      const randomHex = Math.random().toString(36).substring(2, 10);
      const timestamp = Date.now().toString(36);
      const newSid = `sess_${randomHex}_${timestamp}`;
      localStorage.setItem("kharridlo_session_id", newSid);
      localStorage.setItem("dhankriya_session_id", newSid);
      localStorage.removeItem("kharridlo_client_cart");
      document.cookie = "kharridlo_cart=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      setSessionId(newSid);
      setCart(null);
      setPolicyResult(null);
      setBuyerApproved(false);
      setPaymentState({ status: "IDLE" });
      setError(null);
      window.dispatchEvent(new Event("cart-updated"));
      fetchCart(newSid);
    }
  };

  const fetchCart = async (sid: string) => {
    setLoading(true);
    setError(null);
    try {
      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
      const url = (isHttps && apiBaseUrl.startsWith("http://localhost"))
        ? `/api/cart/${sid}`
        : `${apiBaseUrl}/api/v1/cart/${sid}`;
      let res: Response | null = null;
      try {
        res = await fetch(url, { cache: "no-store" });
      } catch {
        res = await fetch(`/api/cart/${sid}`, { cache: "no-store" });
      }
      if (!res || !res.ok) {
        const fallbackRes = await fetch(`/api/cart/${sid}`, { cache: "no-store" });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          setCart(data);
          if (typeof window !== "undefined") {
            try {
              if (data.items && data.items.length > 0) {
                localStorage.setItem("kharridlo_client_cart", JSON.stringify(data.items));
              } else {
                localStorage.removeItem("kharridlo_client_cart");
              }
            } catch {}
          }
          return;
        }
      }
      let data: CartResponse = await res.json();
      if ((!data.items || data.items.length === 0) && url !== `/api/cart/${sid}`) {
        const serverlessRes = await fetch(`/api/cart/${sid}`, { cache: "no-store" }).catch(() => null);
        if (serverlessRes && serverlessRes.ok) {
          const serverlessData = await serverlessRes.json();
          if (serverlessData.items && serverlessData.items.length > 0) {
            data = serverlessData;
          }
        }
      }
      setCart(data);
      if (typeof window !== "undefined") {
        try {
          if (data.items && data.items.length > 0) {
            localStorage.setItem("kharridlo_client_cart", JSON.stringify(data.items));
          } else {
            localStorage.removeItem("kharridlo_client_cart");
          }
        } catch {}
      }
    } catch (err: any) {
      setError(err?.message || "Unable to reach cart service");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, newQty: number) => {
    if (newQty <= 0) {
      await removeItem(productId);
      return;
    }
    setActionLoading(productId);
    setError(null);
    setPolicyResult(null); // Invalidate prior policy check on cart modification
    setBuyerApproved(false);
    try {
      const sid = sessionId || getOrCreateSessionId();
      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
      let res: Response | null = null;
      if (isHttps && apiBaseUrl.startsWith("http://localhost")) {
        res = await fetch(`/api/cart/${sid}/items/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: newQty }),
        });
      } else {
        try {
          res = await fetch(`${apiBaseUrl}/api/v1/cart/${sid}/items/${productId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: newQty }),
          });
          if (!res.ok && (res.status === 404 || res.status === 405)) {
            res = await fetch(`${apiBaseUrl}/api/v1/cart/${sid}/items`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ product_id: productId, quantity: newQty }),
            });
          }
        } catch {
          res = await fetch(`/api/cart/${sid}/items/${productId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: newQty }),
          });
        }
      }
      if (!res || !res.ok) {
        res = await fetch(`/api/cart/${sid}/items/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: newQty }),
        });
      }
      if (res && res.ok) {
        const updatedCart: CartResponse = await res.json();
        setCart(updatedCart);
        window.dispatchEvent(new Event("cart-updated"));
      } else {
        const errData = await res?.json().catch(() => null);
        throw new Error(errData?.detail?.message || "Failed to update quantity");
      }
    } catch (err: any) {
      setError(err?.message || "Error updating item quantity");
    } finally {
      setActionLoading(null);
    }
  };

  const removeItem = async (productId: string) => {
    setActionLoading(productId);
    setError(null);
    setPolicyResult(null);
    setBuyerApproved(false);
    try {
      const sid = sessionId || getOrCreateSessionId();
      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
      let res: Response | null = null;
      if (isHttps && apiBaseUrl.startsWith("http://localhost")) {
        res = await fetch(`/api/cart/${sid}/items/${productId}`, {
          method: "DELETE",
        });
      } else {
        try {
          res = await fetch(`${apiBaseUrl}/api/v1/cart/${sid}/items/${productId}`, {
            method: "DELETE",
          });
        } catch {
          res = await fetch(`/api/cart/${sid}/items/${productId}`, {
            method: "DELETE",
          });
        }
      }
      if (!res || !res.ok) {
        res = await fetch(`/api/cart/${sid}/items/${productId}`, {
          method: "DELETE",
        });
      }
      if (res && res.ok) {
        const updatedCart: CartResponse = await res.json();
        setCart(updatedCart);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("kharridlo_client_cart", JSON.stringify(updatedCart.items || []));
          } catch {}
        }
        window.dispatchEvent(new Event("cart-updated"));
      } else {
        await fetchCart(sid);
      }
    } catch (err: any) {
      setError(err?.message || "Error removing item");
    } finally {
      setActionLoading(null);
    }
  };

  const clearCart = async () => {
    setActionLoading("clear");
    setError(null);
    setPolicyResult(null);
    setBuyerApproved(false);
    try {
      const sid = sessionId || getOrCreateSessionId();
      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
      let res: Response | null = null;
      if (isHttps && apiBaseUrl.startsWith("http://localhost")) {
        res = await fetch(`/api/cart/${sid}`, { method: "DELETE" });
      } else {
        try {
          res = await fetch(`${apiBaseUrl}/api/v1/cart/${sid}`, { method: "DELETE" });
          if (!res.ok) {
            res = await fetch(`${apiBaseUrl}/api/v1/cart/${sid}/clear`, { method: "POST" });
          }
        } catch {
          res = await fetch(`/api/cart/${sid}`, { method: "DELETE" });
        }
      }
      if (!res || !res.ok) {
        res = await fetch(`/api/cart/${sid}`, { method: "DELETE" });
      }
      if (res && res.ok) {
        const updatedCart: CartResponse = await res.json();
        setCart(updatedCart);
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("kharridlo_client_cart");
            document.cookie = "kharridlo_cart=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          } catch {}
        }
        window.dispatchEvent(new Event("cart-updated"));
      } else {
        await fetchCart(sid);
      }
    } catch (err: any) {
      setError(err?.message || "Error clearing cart");
    } finally {
      setActionLoading(null);
    }
  };

  const switchTier = async (newTier: string) => {
    setSelectedTier(newTier);
    setBuyerApproved(false);
    setPaymentState({ status: "IDLE" });
    try {
      const sid = sessionId || getOrCreateSessionId();
      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
      const url = (isHttps && apiBaseUrl.startsWith("http://localhost"))
        ? `/api/policy/${sid}/tier`
        : `${apiBaseUrl}/api/v1/policy/${sid}/tier`;
      let tierRes: Response | null = null;
      try {
        tierRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: newTier }),
        });
      } catch {
        tierRes = null;
      }
      if (!tierRes || !tierRes.ok) {
        await fetch(`/api/policy/${sid}/tier`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: newTier }),
        });
      }
      if (cart && cart.items.length > 0) {
        evaluateCommercePolicy();
      }
    } catch {
      // Ignore
    }
  };

  const evaluateCommercePolicy = async () => {
    setEvaluatingPolicy(true);
    setError(null);
    setBuyerApproved(false);
    setPaymentState({ status: "IDLE" });
    try {
      const sid = sessionId || getOrCreateSessionId();
      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
      const payload = {
        cart_items: cart?.items || [],
        tier: selectedTier,
      };
      const url = (isHttps && apiBaseUrl.startsWith("http://localhost"))
        ? `/api/policy/evaluate/${sid}`
        : `${apiBaseUrl}/api/v1/policy/evaluate/${sid}`;
      let res: Response | null = null;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        res = null;
      }
      if (!res || !res.ok) {
        res = await fetch(`/api/policy/evaluate/${sid}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (!res || !res.ok) {
        throw new Error(`Policy evaluation failed: ${res?.status || "error"}`);
      }
      let data: PolicyEvaluationResponse = await res.json();
      // If backend evaluated empty DB cart while frontend has items, fall back to serverless policy evaluator
      if (
        (data.cart_total_paise === 0 || data.reasons?.some((r: any) => r.code === "EMPTY_CART")) &&
        cart && cart.items && cart.items.length > 0 &&
        url !== `/api/policy/evaluate/${sid}`
      ) {
        const fallbackRes = await fetch(`/api/policy/evaluate/${sid}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(() => null);
        if (fallbackRes && fallbackRes.ok) {
          data = await fallbackRes.json();
        }
      }
      setPolicyResult(data);
    } catch (err: any) {
      setError(err?.message || "Failed to execute deterministic policy check");
    } finally {
      setEvaluatingPolicy(false);
    }
  };

  const formatPrice = (paise: number) => {
    const inr = paise / 100;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(inr);
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

  const initiatePaymentFlow = async () => {
    setPaymentState({ status: "PROCESSING" });
    setError(null);

    try {
      const sid = sessionId || getOrCreateSessionId();
      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
      const confirmPayload = {
        buyer_confirmed: true,
        cart_items: cart?.items || [],
        tier: selectedTier,
        total_paise: cart?.total_paise,
      };

      // 1. Confirm checkout authorization
      let confirmRes: Response | null = null;
      const confirmUrl = (isHttps && apiBaseUrl.startsWith("http://localhost"))
        ? `/api/checkout/confirm?session_id=${sid}`
        : `${apiBaseUrl}/api/v1/checkout/confirm?session_id=${sid}`;
      try {
        confirmRes = await fetch(confirmUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Session-ID": sid,
          },
          body: JSON.stringify(confirmPayload),
        });
      } catch {
        confirmRes = null;
      }
      if (!confirmRes || !confirmRes.ok) {
        confirmRes = await fetch(`/api/checkout/confirm?session_id=${sid}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Session-ID": sid },
          body: JSON.stringify(confirmPayload),
        });
      }
      if (!confirmRes.ok) {
        const err = await confirmRes.json().catch(() => ({}));
        throw new Error(err.detail?.message || "Checkout confirmation failed");
      }
      const checkoutData = await confirmRes.json();

      // 2. Server creates Razorpay Order
      const orderPayload = {
        checkout_id: checkoutData.id,
        cart_items: cart?.items || [],
        total_paise: cart?.total_paise,
      };
      let orderRes: Response | null = null;
      const orderUrl = (isHttps && apiBaseUrl.startsWith("http://localhost"))
        ? `/api/payments/orders?session_id=${sid}`
        : `${apiBaseUrl}/api/v1/payments/orders?session_id=${sid}`;
      try {
        orderRes = await fetch(orderUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Session-ID": sid,
          },
          body: JSON.stringify(orderPayload),
        });
      } catch {
        orderRes = null;
      }
      if (!orderRes || !orderRes.ok) {
        orderRes = await fetch(`/api/payments/orders?session_id=${sid}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Session-ID": sid },
          body: JSON.stringify(orderPayload),
        });
      }
      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        throw new Error(err.detail?.message || "Order creation failed");
      }
      const orderData = await orderRes.json();

      // 3. Try to load Razorpay Checkout script
      const scriptLoaded = await loadRazorpayScript();

      if (scriptLoaded && (window as any).Razorpay) {
        // Open standard Razorpay Checkout Modal
        const options: any = {
          key: orderData.key_id,
          amount: orderData.amount_paise,
          currency: orderData.currency || "INR",
          name: "Kharridlo",
          description: "Autonomous Commerce Gateway (Test Mode)",
          prefill: {
            name: "Kharridlo Buyer",
            email: "buyer@kharridlo.test",
            contact: "9876543210",
          },
          handler: async function (response: any) {
            await verifyPaymentSignature(
              orderData.internal_order_id,
              response.razorpay_order_id || orderData.razorpay_order_id || "",
              response.razorpay_payment_id,
              response.razorpay_signature || "",
              orderData.amount_paise
            );
          },
          modal: {
            ondismiss: async function () {
              const cancelUrl = (isHttps && apiBaseUrl.startsWith("http://localhost"))
                ? `/api/payments/cancel?session_id=${sid}`
                : `${apiBaseUrl}/api/v1/payments/cancel?session_id=${sid}`;
              try {
                await fetch(cancelUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "X-Session-ID": sid },
                  body: JSON.stringify({
                    internal_order_id: orderData.internal_order_id,
                    reason: "buyer_dismissed_checkout",
                  }),
                });
              } catch {
                await fetch(`/api/payments/cancel?session_id=${sid}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "X-Session-ID": sid },
                  body: JSON.stringify({
                    internal_order_id: orderData.internal_order_id,
                    reason: "buyer_dismissed_checkout",
                  }),
                });
              }
              setPaymentState({
                status: "CANCELLED",
                internalOrderId: orderData.internal_order_id,
                error: "Checkout modal dismissed. You can retry payment whenever ready.",
              });
            },
          },
          theme: {
            color: "#4f46e5",
          },
        };

        // Only attach order_id if it's an authentic Razorpay order returned from the API
        // Never attach mock or fake order IDs which cause Razorpay checkout modal to crash with "Uh! oh!"
        if (
          orderData.razorpay_order_id &&
          !orderData.razorpay_order_id.startsWith("order_test_") &&
          !orderData.razorpay_order_id.includes("fake")
        ) {
          options.order_id = orderData.razorpay_order_id;
        }

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", async function (response: any) {
          const cancelUrl = (isHttps && apiBaseUrl.startsWith("http://localhost"))
            ? `/api/payments/cancel?session_id=${sid}`
            : `${apiBaseUrl}/api/v1/payments/cancel?session_id=${sid}`;
          try {
            await fetch(cancelUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Session-ID": sid },
              body: JSON.stringify({
                internal_order_id: orderData.internal_order_id,
                reason: "payment_failed_at_gateway",
                razorpay_payment_id: response.error?.metadata?.payment_id,
                failure_code: response.error?.code,
                failure_description: response.error?.description,
              }),
            });
          } catch {
            await fetch(`/api/payments/cancel?session_id=${sid}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Session-ID": sid },
              body: JSON.stringify({
                internal_order_id: orderData.internal_order_id,
                reason: "payment_failed_at_gateway",
                razorpay_payment_id: response.error?.metadata?.payment_id,
                failure_code: response.error?.code,
                failure_description: response.error?.description,
              }),
            });
          }
          setPaymentState({
            status: "FAILED",
            internalOrderId: orderData.internal_order_id,
            error: response.error?.description || "Payment failed at gateway",
          });
        });

        rzp.open();
      } else {
        // Fallback simulated capture for headless environments
        setPaymentState({
          status: "PROCESSING",
          internalOrderId: orderData.internal_order_id,
          razorpayOrderId: orderData.razorpay_order_id,
          amountPaise: orderData.amount_paise,
        });

        const testPaymentId = `pay_test_${Math.random().toString(36).substring(2, 10)}`;
        const testSig = `test_sig_${Math.random().toString(36).substring(2, 12)}`;
        
        await verifyPaymentSignature(
          orderData.internal_order_id,
          orderData.razorpay_order_id,
          testPaymentId,
          testSig,
          orderData.amount_paise
        );
      }
    } catch (err: any) {
      setPaymentState({
        status: "FAILED",
        error: err.message || "Failed to process payment",
      });
    }
  };

  const verifyPaymentSignature = async (
    internalOrderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    amountPaise: number
  ) => {
    try {
      const sid = sessionId || getOrCreateSessionId();
      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
      const url = (isHttps && apiBaseUrl.startsWith("http://localhost"))
        ? `/api/payments/verify`
        : `${apiBaseUrl}/api/v1/payments/verify`;
      let verifyRes: Response | null = null;
      try {
        verifyRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            internal_order_id: internalOrderId,
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
          }),
        });
      } catch {
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
        throw new Error(err.detail?.message || "Signature verification rejected by server");
      }

      setPaymentState({
        status: "SUCCESS",
        internalOrderId,
        razorpayOrderId,
        razorpayPaymentId,
        amountPaise,
      });

      window.dispatchEvent(new Event("cart-updated"));
      // Refresh cart to reflect conversion
      fetchCart(sid);
    } catch (err: any) {
      setPaymentState({
        status: "FAILED",
        internalOrderId,
        error: err.message || "Payment verification failed",
      });
    }
  };

  const checkPaymentStatus = async (orderId: string) => {
    try {
      setActionLoading("check_status");
      const res = await fetch(`${apiBaseUrl}/api/v1/payments/orders/${orderId}`, {
        headers: { "X-Session-ID": sessionId },
      });
      if (res.ok) {
        const orderData = await res.json();
        if (orderData.status === "paid") {
          setPaymentState((prev) => ({
            ...prev,
            status: "SUCCESS",
            error: undefined,
          }));
          fetchCart(sessionId);
        } else if (orderData.status === "failed") {
          setPaymentState((prev) => ({
            ...prev,
            status: "FAILED",
            error: "Payment was marked as failed by bank/gateway.",
          }));
        } else {
          setPaymentState((prev) => ({
            ...prev,
            status: "PENDING",
            error: "Payment is still being processed. Please check back shortly.",
          }));
        }
      }
    } catch {
      // Graceful error handling
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/catalog" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              Catalog
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center space-x-3">
              <Logo variant="compact" size="sm" href="/" />
              <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                Razorpay Test Mode Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/merchant"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Merchant Audit Trail
            </Link>
            <div className="text-xs text-slate-500 font-mono hidden md:flex items-center gap-2">
              <span>Session: {sessionId.substring(0, 10)}...</span>
              <button
                onClick={startNewSession}
                title="Start a fresh, isolated buyer session"
                className="px-2 py-0.5 text-[11px] font-sans font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
              >
                New Session
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title & Expiration Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-indigo-600" />
              Authoritative Cart & Payment Gate
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              &quot;AI proposes. Deterministic systems verify and authorize.&quot; — Strict server-side Razorpay orchestration.
            </p>
          </div>

          {cart && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>30-min inventory reservation</span>
              </div>
              {cart.items.length > 0 && paymentState.status !== "SUCCESS" && (
                <button
                  onClick={clearCart}
                  disabled={actionLoading !== null}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-200"
                >
                  Clear Cart
                </button>
              )}
            </div>
          )}
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-rose-900">Cart / Policy Notification</h3>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* PAYMENT SUCCESS RECEIPT SCREEN */}
        {paymentState.status === "SUCCESS" && (
          <div className="mb-8 p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border-2 border-emerald-300 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Transaction Authorized & Captured
                </span>
                <h2 className="text-xl font-extrabold text-emerald-950">Payment Completed in Razorpay Test Mode!</h2>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Cryptographic HMAC-SHA256 signature verified by Kharridlo server. Stock consumption finalized.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-white/90 rounded-xl border border-emerald-200 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-sans block uppercase">Internal Order ID</span>
                <span className="font-bold text-slate-800">{paymentState.internalOrderId}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-sans block uppercase">Razorpay Payment ID</span>
                <span className="font-bold text-indigo-700">{paymentState.razorpayPaymentId}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-sans block uppercase">Amount Authorized</span>
                <span className="font-bold text-emerald-700">{formatPrice(paymentState.amountPaise || 0)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Link
                href="/merchant"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                Inspect in Merchant Audit Trail
              </Link>
              <Link
                href="/catalog"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 transition-colors border border-slate-200 flex items-center gap-1.5 shadow-sm"
              >
                Continue Shopping
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* PAYMENT PENDING BANNER */}
        {paymentState.status === "PENDING" && (
          <div className="mb-6 p-5 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 rounded-2xl border-2 border-amber-300 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md animate-pulse">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Verification In Progress
                </span>
                <h3 className="text-base font-extrabold text-amber-950">Payment Awaiting Gateway Confirmation</h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  {paymentState.error || "Your transaction is currently being processed. Inventory remains held and stock will only be consumed once confirmed."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => paymentState.internalOrderId && checkPaymentStatus(paymentState.internalOrderId)}
                disabled={actionLoading !== null}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? "animate-spin" : ""}`} />
                Check Status Now
              </button>
              <button
                onClick={() => setPaymentState({ status: "IDLE" })}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors border border-slate-300"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* PAYMENT CANCELLED / FAILED SCREEN */}
        {(paymentState.status === "CANCELLED" || paymentState.status === "FAILED") && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-900 text-xs">
                  {paymentState.status === "CANCELLED" ? "Payment Dismissed / Cancelled" : "Payment Attempt Failed"}
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">{paymentState.error}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={initiatePaymentFlow}
                disabled={actionLoading !== null}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Payment
              </button>
              <button
                onClick={() => setPaymentState({ status: "IDLE" })}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors shadow-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
            <p className="text-sm font-medium">Loading authoritative cart session...</p>
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md mx-auto">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Your cart is currently empty</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Explore the deterministic synthetic catalog or ask the AI buyer assistant to recommend products.
            </p>
            <div className="mt-5">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Browse Catalog
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Cart Line Items */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">
                    Cart Items ({cart.total_items_count})
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Cart ID: {cart.id.substring(0, 8)}...
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {cart.items.map((item) => (
                    <div key={item.id} className="p-4 sm:p-5 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                            {item.sku}
                          </span>
                          <span className="text-xs text-slate-500">{item.brand}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 leading-snug">{item.name}</h4>
                        <div className="text-xs text-slate-500 font-mono">
                          {formatPrice(item.unit_price_paise)} each
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className="font-bold text-sm text-slate-900 font-mono">
                          {formatPrice(item.line_total_paise)}
                        </span>

                        {paymentState.status !== "SUCCESS" && (
                          <div className="flex items-center gap-1 bg-slate-50 rounded-lg border border-slate-200 p-0.5">
                            <button
                              onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                              disabled={actionLoading !== null || item.quantity <= 1}
                              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold font-mono">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                              disabled={actionLoading !== null}
                              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeItem(item.product_id)}
                              disabled={actionLoading !== null}
                              className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Policy Gate */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
                  Financial Summary (Integer Paise)
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatPrice(cart.subtotal_paise)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Estimated Shipping</span>
                    <span className="text-emerald-600 font-semibold">FREE</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-sm text-slate-900">
                    <span>Total Authoritative Amount</span>
                    <span className="font-mono text-indigo-600">{formatPrice(cart.total_paise)}</span>
                  </div>
                </div>

                {/* Policy Tier Selector */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Active Policy Tier Simulation
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {["RESTRICTED", "STANDARD", "ELEVATED"].map((tier) => (
                      <button
                        key={tier}
                        onClick={() => switchTier(tier)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                          selectedTier === tier
                            ? "bg-indigo-50 border-indigo-400 text-indigo-700 shadow-xs"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Policy Evaluation Trigger */}
                <div className="pt-2">
                  <button
                    onClick={evaluateCommercePolicy}
                    disabled={evaluatingPolicy}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <ShieldCheck className={`w-4 h-4 ${evaluatingPolicy ? "animate-spin" : ""}`} />
                    Evaluate Commerce Policy Gate
                  </button>
                </div>

                {/* Policy Result Card */}
                {policyResult && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Policy Gate Status
                      </span>
                      {policyResult.decision === "AUTHORIZATION_REQUIRED" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Auth Required
                        </span>
                      ) : policyResult.decision === "ALLOW" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Allowed
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Blocked
                        </span>
                      )}
                    </div>

                    {/* BLOCKED STATE */}
                    {policyResult.decision === "BLOCK" && (
                      <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 space-y-2">
                        <div className="flex items-start gap-2">
                          <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-rose-800 leading-snug">
                            {policyResult.reasons[0]?.message}
                          </p>
                        </div>
                        <div className="p-2 bg-white rounded text-[11px] font-mono text-rose-900 border border-rose-100">
                          Limit: {formatPrice(policyResult.max_single_transaction_paise)} | Cart: {formatPrice(policyResult.cart_total_paise)}
                        </div>
                      </div>
                    )}

                    {/* AUTHORIZATION REQUIRED / ALLOWED STATE */}
                    {(policyResult.decision === "AUTHORIZATION_REQUIRED" || policyResult.decision === "ALLOW") && (
                      <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-3">
                        <div className="flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-emerald-900 font-medium">
                            Commerce policy bounds satisfied. Remaining buffer: {formatPrice(policyResult.remaining_buffer_paise)}.
                          </p>
                        </div>

                        {/* Explicit Buyer Authorization Gate */}
                        {!buyerApproved ? (
                          <button
                            onClick={() => setBuyerApproved(true)}
                            className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <UserCheck className="w-4 h-4" />
                            Grant Explicit Buyer Authorization
                          </button>
                        ) : (
                          <div className="space-y-3 pt-2 border-t border-emerald-200">
                            <div className="p-2.5 bg-white rounded-lg border border-emerald-300 text-xs text-emerald-900 flex items-center gap-2">
                              <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <span className="font-bold">Buyer Authorization Granted</span>
                            </div>

                            {/* RAZORPAY TEST MODE CHECKOUT BUTTON */}
                            {paymentState.status !== "SUCCESS" && (
                              <button
                                onClick={initiatePaymentFlow}
                                disabled={paymentState.status === "PROCESSING"}
                                className="w-full py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-60"
                              >
                                {paymentState.status === "PROCESSING" ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Orchestrating Server Razorpay Order...</span>
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="w-4 h-4" />
                                    <span>Pay {formatPrice(cart.total_paise)} via Razorpay (Test Mode)</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating AI Assistant Drawer */}
      <AIAssistantDrawer onCartUpdated={() => fetchCart(sessionId)} />
    </div>
  );
}
