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
  UserCheck
} from "lucide-react";
import { getOrCreateSessionId } from "@/lib/session";
import AIAssistantDrawer from "@/components/AIAssistantDrawer";

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

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    const sid = getOrCreateSessionId();
    setSessionId(sid);
    fetchCart(sid);
    fetchPolicyTiers();
  }, []);

  const fetchPolicyTiers = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/policy/tiers`, { cache: "no-store" });
      if (res.ok) {
        const tiers: PolicyTierSummary[] = await res.json();
        setAvailableTiers(tiers);
      }
    } catch {
      // Graceful fallback
    }
  };

  const fetchCart = async (sid: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/cart/${sid}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to load cart: ${res.status} ${res.statusText}`);
      }
      const data: CartResponse = await res.json();
      setCart(data);
    } catch (err: any) {
      setError(err?.message || "Unable to reach cart service");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, newQty: number) => {
    if (newQty < 1) return;
    setActionLoading(productId);
    setError(null);
    setBuyerApproved(false);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/cart/${sessionId}/items/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.detail?.message || "Failed to update item quantity");
      }
      const updatedCart: CartResponse = await res.json();
      setCart(updatedCart);
      setPolicyResult(null);
    } catch (err: any) {
      setError(err?.message || "Quantity update failed");
    } finally {
      setActionLoading(null);
    }
  };

  const removeItem = async (productId: string) => {
    setActionLoading(productId);
    setError(null);
    setBuyerApproved(false);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/cart/${sessionId}/items/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.detail?.message || "Failed to remove item");
      }
      const updatedCart: CartResponse = await res.json();
      setCart(updatedCart);
      setPolicyResult(null);
    } catch (err: any) {
      setError(err?.message || "Remove item failed");
    } finally {
      setActionLoading(null);
    }
  };

  const clearCart = async () => {
    if (!confirm("Are you sure you want to clear your cart? All reserved stock will be released.")) return;
    setLoading(true);
    setError(null);
    setBuyerApproved(false);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/cart/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to clear cart");
      }
      const updatedCart: CartResponse = await res.json();
      setCart(updatedCart);
      setPolicyResult(null);
    } catch (err: any) {
      setError(err?.message || "Clear cart failed");
    } finally {
      setLoading(false);
    }
  };

  const switchTier = async (newTier: string) => {
    setSelectedTier(newTier);
    setBuyerApproved(false);
    try {
      await fetch(`${apiBaseUrl}/api/v1/policy/${sessionId}/tier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: newTier }),
      });
      // Automatically re-evaluate policy with new tier
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
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/policy/evaluate/${sessionId}`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error(`Policy evaluation failed: ${res.status}`);
      }
      const data: PolicyEvaluationResponse = await res.json();
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
            <div className="flex items-center space-x-2">
              <span className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                ख
              </span>
              <span className="font-bold text-lg text-slate-900">Kharridlo</span>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded border border-indigo-200">
                Policy Engine Active
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-mono hidden sm:flex items-center gap-3">
            <span>Session: {sessionId.substring(0, 12)}...</span>
            <span>•</span>
            <span>Milestone 4: Deterministic Policy Engine</span>
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
              Authoritative Cart & Policy Gate
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              &quot;AI proposes. Deterministic systems verify and authorize.&quot; — Strict financial bounds in integer paise.
            </p>
          </div>

          {cart && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>30-min inventory reservation</span>
              </div>
              {cart.items.length > 0 && (
                <button
                  onClick={clearCart}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-rose-600 text-xs font-semibold transition-colors"
                >
                  Clear Cart
                </button>
              )}
            </div>
          )}
        </div>

        {/* Global Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-600 font-bold ml-4">
              Dismiss
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">Connecting to authoritative commerce layer...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && cart && cart.items.length === 0 && (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md mx-auto my-8">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-800">Your cart is empty</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Add products like the TechNova Laptop Pro 15 (₹64,999) or Ultra Laptop (₹1,49,000) to test deterministic policy decisions!
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Browse 84 SKUs in Catalog
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Cart & Policy Contents */}
        {!loading && cart && cart.items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items List (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                        {item.brand}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-400 font-mono">SKU: {item.sku}</span>
                    </div>

                    <h3 className="font-semibold text-slate-900 text-sm">{item.name}</h3>

                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 font-mono">
                      <span>Unit Price: {formatPrice(item.unit_price_paise)}</span>
                      <span>({item.unit_price_paise} paise)</span>
                    </div>
                  </div>

                  {/* Quantity and Actions */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6">
                    {/* Quantity Controls */}
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || actionLoading === item.product_id}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-900 font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        disabled={actionLoading === item.product_id}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-right min-w-[100px]">
                      <span className="text-base font-bold text-slate-900 block">
                        {formatPrice(item.line_total_paise)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {item.line_total_paise} paise
                      </span>
                    </div>

                    {/* Delete Item */}
                    <button
                      onClick={() => removeItem(item.product_id)}
                      disabled={actionLoading === item.product_id}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Demo Helper Callout */}
              <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-xs text-slate-600 space-y-1">
                <span className="font-bold text-indigo-900 block text-xs">Milestone 4 Demo Guidelines:</span>
                <p>• <strong>Safe Purchase:</strong> TechNova Laptop Pro 15 (₹64,999) falls within the ₹70,000 Standard Tier limit.</p>
                <p>• <strong>Safe Bundle:</strong> Laptop + Precision Mouse = ₹66,498 (within ₹70,000 limit with ₹3,502 buffer).</p>
                <p>• <strong>Policy Block:</strong> TechNova Laptop Ultra 16 (₹1,49,000) triggers a hard block on the ₹70,000 Standard Tier.</p>
              </div>
            </div>

            {/* Order Summary & Deterministic Policy Gate Card (1 col) */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                  Cart Order Summary
                </h2>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Items Count</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {cart.total_items_count} units
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {formatPrice(cart.subtotal_paise)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                    <span>Authoritative Subtotal</span>
                    <span>{cart.subtotal_paise} paise</span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-sm">Cart Total</span>
                    <div className="text-right">
                      <span className="text-xl font-bold text-slate-900 block">
                        {formatPrice(cart.total_paise)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {cart.total_paise} paise (INR)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Policy Tier Selector (For Testing/Demo Scenarios) */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Simulate Policy Tier
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {["STANDARD", "ELEVATED", "RESTRICTED"].map((tier) => (
                      <button
                        key={tier}
                        onClick={() => switchTier(tier)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                          selectedTier === tier
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {tier === "STANDARD" ? "Standard (₹70k)" : tier === "ELEVATED" ? "Elevated (₹1.5L)" : "Restricted (₹25k)"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Policy Evaluation Button */}
                <div className="mt-4 pt-2">
                  <button
                    onClick={evaluateCommercePolicy}
                    disabled={evaluatingPolicy}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <ShieldCheck className={`w-4 h-4 ${evaluatingPolicy ? "animate-spin" : ""}`} />
                    Evaluate Commerce Policy Gate
                  </button>
                </div>

                {/* Policy Decision Output Card */}
                {policyResult && (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Policy Evaluation Result
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
                      <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-rose-900 text-xs">Transaction Blocked by Policy</h4>
                            <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                              {policyResult.reasons[0]?.message}
                            </p>
                          </div>
                        </div>

                        <div className="p-2.5 bg-white/80 rounded-lg border border-rose-200/80 text-[11px] text-rose-800 font-mono">
                          <div>Single-Transaction Cap: {formatPrice(policyResult.max_single_transaction_paise)}</div>
                          <div>Cart Total Attempted: {formatPrice(policyResult.cart_total_paise)}</div>
                        </div>

                        {/* Critical Safety Notice */}
                        <div className="pt-2 border-t border-rose-200/60 flex items-center gap-1.5 text-rose-900 font-bold text-xs">
                          <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                          <span>Payment has not been initiated.</span>
                        </div>
                      </div>
                    )}

                    {/* AUTHORIZATION REQUIRED STATE */}
                    {policyResult.decision === "AUTHORIZATION_REQUIRED" && (
                      <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-emerald-900 text-xs">Commerce Policy Checks Passed</h4>
                            <p className="text-[11px] text-emerald-700 mt-0.5">
                              Cart total is within policy limits. Remaining budget buffer: {formatPrice(policyResult.remaining_buffer_paise)}.
                            </p>
                          </div>
                        </div>

                        {/* Structured Rules Facts */}
                        <div className="space-y-1.5 text-[11px]">
                          {policyResult.reasons.map((reason, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-slate-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <span>{reason.message}</span>
                            </div>
                          ))}
                        </div>

                        {/* Buyer Approval Gate */}
                        <div className="pt-3 border-t border-emerald-200/60 space-y-2">
                          {!buyerApproved ? (
                            <button
                              onClick={() => setBuyerApproved(true)}
                              className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <UserCheck className="w-4 h-4" />
                              Explicit Buyer Authorization
                            </button>
                          ) : (
                            <div className="p-3 bg-white rounded-xl border border-emerald-300 text-xs text-emerald-800 space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                                <UserCheck className="w-4 h-4 text-emerald-600" />
                                <span>Buyer Authorization Granted!</span>
                              </div>
                              <p className="text-[11px] text-slate-600">
                                Transaction is authorized to proceed to payment pipeline in Milestone 6 (Razorpay Test Mode).
                              </p>
                              <div className="text-[10px] text-amber-700 font-semibold pt-1 border-t border-slate-100 flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                <span>Payment has not been initiated.</span>
                              </div>
                            </div>
                          )}
                        </div>
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
