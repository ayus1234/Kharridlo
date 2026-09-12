"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  X, 
  Send, 
  ShieldCheck, 
  ShieldAlert, 
  ShoppingBag, 
  Search, 
  Check, 
  AlertTriangle,
  ChevronRight,
  Bot,
  GitCompare,
  Plus,
  ArrowRight
} from "lucide-react";
import { getOrCreateSessionId } from "@/lib/session";
import Logo from "@/components/Logo";
import ProductImage from "@/components/ProductImage";
import RequirementSummaryCard, { parseRequirementsFromPrompt, ShoppingRequirements } from "@/components/dynamic/RequirementSummaryCard";
import WhyRecommended from "@/components/dynamic/WhyRecommended";
import AIActionBar from "@/components/dynamic/AIActionBar";

interface ToolCall {
  tool_name: string;
  arguments: Record<string, any>;
  result: Record<string, any>;
}

interface ProductRecommendation {
  id: string;
  name: string;
  price_inr: number;
  category: string;
  brand: string;
  image_url?: string;
  specs?: Record<string, any>;
  tradeoffType?: string;
  tradeoffSummary?: string;
  reasons?: string[];
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  tool_calls?: ToolCall[];
  policy?: any;
  cart?: any;
  checkout_url?: string;
  recommendedProducts?: ProductRecommendation[];
  requirements?: ShoppingRequirements | null;
  clarification_question?: string;
  clarification_options?: string[];
  budget_gap_notice?: string | null;
  execution_mode?: string;
  model?: string;
  timestamp: string;
}

interface AIAssistantDrawerProps {
  onCartUpdated?: () => void;
}

const QUICK_PROMPTS = [
  "Find me a coding laptop under ₹80k",
  "Phone under ₹40k with good camera",
  "Show me something cheaper",
  "Noise-cancelling headphones for study",
  "Compare developer monitors",
];

export default function AIAssistantDrawer({ onCartUpdated }: AIAssistantDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [activeRequirements, setActiveRequirements] = useState<ShoppingRequirements | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I am your Kharridlo AI Shopping Companion, powered by Gemini 2.0 and bounded commerce tools. Tell me your needs, budget, or preferred specs (e.g. *'Laptop under ₹80k for coding'*), and I'll recommend the best options with transparent trade-offs.",
      timestamp: "Just now",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccessId, setActionSuccessId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sid = getOrCreateSessionId();
    setSessionId(sid);

    const handleOpenChat = (e: any) => {
      setIsOpen(true);
      if (e.detail?.prompt) {
        setTimeout(() => {
          sendMessage(e.detail.prompt);
        }, 150);
      }
    };
    window.addEventListener("open-ai-chat", handleOpenChat);
    return () => window.removeEventListener("open-ai-chat", handleOpenChat);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const extractProductsFromResponse = (data: any): ProductRecommendation[] => {
    const products: ProductRecommendation[] = [];
    const seen = new Set<string>();

    const addCandidate = (raw: any) => {
      if (!raw) return;
      const id = String(raw.id || raw.sku || raw.provider_product_id || "");
      const name = String(raw.name || raw.title || "");
      if (!id || !name || seen.has(id)) return;
      seen.add(id);

      const priceInr = Number(
        raw.price_inr ?? raw.source_price_inr ?? 
        (raw.price_paise ? raw.price_paise / 100 : 0)
      );

      products.push({
        id,
        name,
        brand: String(raw.brand || "Kharridlo Verified"),
        category: String(raw.category || "Electronics"),
        price_inr: priceInr || 24999,
        image_url: raw.image_url || raw.primary_image_url,
        specs: raw.specs || raw.specifications || {},
        tradeoffType: raw.tradeoffType,
        tradeoffSummary: raw.tradeoffSummary,
        reasons: Array.isArray(raw.reasons) ? raw.reasons : undefined,
      });
    };

    if (Array.isArray(data.recommended_products)) {
      data.recommended_products.forEach(addCandidate);
    }
    if (data.tradeoff_groups) {
      addCandidate(data.tradeoff_groups.bestOverall);
      addCandidate(data.tradeoff_groups.bestValue);
      addCandidate(data.tradeoff_groups.bestPerformance);
      addCandidate(data.tradeoff_groups.budgetAlternative);
    }
    if (Array.isArray(data.products)) {
      data.products.forEach(addCandidate);
    }
    if (Array.isArray(data.tool_calls)) {
      data.tool_calls.forEach((tc: any) => {
        const res = tc.result || {};
        if (Array.isArray(res.items)) res.items.forEach(addCandidate);
        if (Array.isArray(res.products)) res.products.forEach(addCandidate);
      });
    }

    return products.slice(0, 4);
  };

  const handleAddToCart = async (product: ProductRecommendation) => {
    try {
      const res = await fetch(`/api/cart/${sessionId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1,
          title: product.name,
          price_paise: Math.round(product.price_inr * 100),
          brand: product.brand,
          category: product.category,
          image_url: product.image_url,
        }),
      });

      if (res.ok) {
        window.dispatchEvent(new Event("cart-updated"));
        if (onCartUpdated) onCartUpdated();
        setActionSuccessId(product.id);
        setTimeout(() => setActionSuccessId(null), 2500);
      }
    } catch {
      // Graceful fallback
    }
  };

  const sendMessage = async (textToSend?: string) => {
    const messageText = textToSend || inputValue.trim();
    if (!messageText || isLoading) return;

    // Check if message specifies requirements
    const parsedReqs = parseRequirementsFromPrompt(messageText);
    const updatedReqs = parsedReqs
      ? { ...activeRequirements, ...parsedReqs }
      : activeRequirements;

    if (parsedReqs) {
      setActiveRequirements(updatedReqs);
    }

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: messageText,
      requirements: parsedReqs,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": sessionId,
        },
        body: JSON.stringify({
          message: messageText,
          session_id: sessionId,
          previous_requirements: updatedReqs,
        }),
      });

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const data = await res.json();
      const extractedProds = extractProductsFromResponse(data);

      if (data.requirements) {
        setActiveRequirements(data.requirements);
      }

      const assistantMessage: Message = {
        id: `asst_${Date.now()}`,
        sender: "assistant",
        text: data.message || data.reply || "I have analyzed your request against our verified catalog.",
        tool_calls: data.tool_calls,
        policy: data.policy,
        cart: data.cart,
        checkout_url: data.checkout_url,
        recommendedProducts: extractedProds,
        requirements: data.requirements,
        clarification_question: data.clarification_question,
        clarification_options: data.clarification_options,
        budget_gap_notice: data.budget_gap_notice,
        execution_mode: data.execution_mode,
        model: data.model,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If tool mutated cart, notify parent and dispatch event
      const hasCartMutation = Boolean(
        data.cart ||
        (data.tool_calls && data.tool_calls.some((t: ToolCall) =>
          t.tool_name === "add_to_cart" ||
          t.tool_name === "remove_from_cart" ||
          t.tool_name === "update_cart_item" ||
          t.tool_name === "clear_cart"
        ))
      );
      if (hasCartMutation) {
        window.dispatchEvent(new Event("cart-updated"));
        if (onCartUpdated) onCartUpdated();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "assistant",
          text: "I encountered a network delay communicating with the commerce service. You can still explore verified hardware in the catalog.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Assistant Launcher Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-gradient-to-r from-ai-violet via-indigo-600 to-growth-dark hover:from-ai-glow hover:to-growth-emerald text-white px-4 py-3 rounded-full shadow-2xl shadow-purple-900/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 font-display font-semibold text-xs sm:text-sm border border-white/20"
        aria-label="Open Kharridlo AI Shopping Companion"
      >
        <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
        <span>Kharridlo Companion</span>
      </button>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[500px] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center p-1 shadow-inner flex-shrink-0">
              <Logo variant="icon" theme="dark" size="sm" asLink={false} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-white text-sm sm:text-base">
                  Kharridlo AI Companion
                </h3>
                <span className="text-[10px] uppercase font-mono-data px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold tracking-wider">
                  Bounded M5
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                AI proposes. Deterministic systems verify. You authorize.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Requirements Bar (if user has active shopping parameters) */}
        {activeRequirements && (
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 text-xs">
            <RequirementSummaryCard
              requirements={activeRequirements}
              onQuickCorrection={(prompt) => sendMessage(prompt)}
              onUpdateRequirement={(updated) => {
                setActiveRequirements(updated);
                sendMessage(`Change budget to ₹${updated.budgetInr?.toLocaleString("en-IN")}`);
              }}
              compact
              className="bg-slate-900 border-slate-800 text-slate-200"
            />
          </div>
        )}

        {/* Quick Prompts Carousel */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-900/50 overflow-x-auto no-scrollbar flex gap-2">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(prompt)}
              disabled={isLoading}
              className="text-xs whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700/60 transition flex items-center gap-1 disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3 text-ai-glow" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  m.sender === "user"
                    ? "bg-gradient-to-r from-ai-violet to-indigo-600 text-white rounded-br-none shadow-md shadow-purple-950/40"
                    : "bg-slate-800/95 text-slate-200 border border-slate-700/70 rounded-bl-none"
                }`}
              >
                {/* Model / Execution Mode Badge */}
                {m.sender === "assistant" && m.execution_mode && (
                  <div className="mb-2">
                    <span
                      className={`text-[10px] font-mono-data font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                        m.execution_mode === "live_gemini"
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-900/80 text-slate-400 border border-slate-700/60"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          m.execution_mode === "live_gemini"
                            ? "bg-emerald-400 animate-pulse"
                            : "bg-cyan-400"
                        }`}
                      />
                      {m.execution_mode === "live_gemini"
                        ? `Live: ${m.model || "Gemini 2.0"}`
                        : "Deterministic Fallback Engine"}
                    </span>
                  </div>
                )}

                {/* Structured Requirements Card if captured from User */}
                {m.requirements && (
                  <div className="mb-3">
                    <RequirementSummaryCard
                      requirements={m.requirements}
                      compact
                      className="bg-white text-navy-900"
                    />
                  </div>
                )}

                {/* Message Text */}
                <p className="whitespace-pre-line text-xs sm:text-sm">{m.text}</p>

                {/* Clarification Quick Option Chips (Single concise question answered in 1 tap) */}
                {m.clarification_options && m.clarification_options.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/70">
                    <p className="text-[10px] font-mono-data uppercase font-bold text-slate-400 tracking-wider mb-2">
                      Choose an option to continue:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {m.clarification_options.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => sendMessage(opt)}
                          disabled={isLoading}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-900/40 hover:bg-ai-violet/50 text-purple-200 border border-purple-500/40 hover:border-purple-400 transition-all active:scale-95 text-left shadow-2xs"
                        >
                          <span>{opt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contextual Product Recommendations Inside Chat */}
                {m.recommendedProducts && m.recommendedProducts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/70 space-y-2.5">
                    <p className="text-[10px] font-mono-data uppercase font-bold text-slate-400 tracking-wider">
                      Matches Found in Catalog:
                    </p>
                    {m.recommendedProducts.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-xl bg-slate-900/90 border border-slate-700 p-2.5 flex flex-col gap-2"
                      >
                        <div className="flex gap-2.5">
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800">
                            <ProductImage
                              src={p.image_url}
                              alt={p.name}
                              category={p.category}
                              productId={p.id}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-[10px] font-mono-data text-slate-400 block truncate">
                                {p.brand} • {p.category}
                              </span>
                              {p.tradeoffType && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  <Sparkles className="w-2 h-2" />
                                  {p.tradeoffType}
                                </span>
                              )}
                            </div>
                            <h5 className="text-xs font-bold text-white line-clamp-1">
                              {p.name}
                            </h5>
                            <div className="text-xs font-mono-data font-bold text-emerald-400 mt-0.5">
                              ₹{p.price_inr.toLocaleString("en-IN")}
                            </div>
                          </div>
                        </div>

                        {/* Why Kharridlo Recommends This snippet */}
                        <div className="bg-slate-950/50 rounded-lg p-1.5 border border-slate-800">
                          <WhyRecommended
                            priceInr={p.price_inr}
                            category={p.category}
                            specs={p.specs}
                            tradeoffType={p.tradeoffType}
                            tradeoffSummary={p.tradeoffSummary}
                            reasons={p.reasons}
                            compact
                          />
                        </div>

                        {/* Interactive Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleAddToCart(p)}
                            className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all active:scale-95"
                          >
                            {actionSuccessId === p.id ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Added to Cart!</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                <span>Add to Cart</span>
                              </>
                            )}
                          </button>

                          <Link
                            href={`/compare?ids=${encodeURIComponent(p.id)}`}
                            className="inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-all"
                          >
                            <GitCompare className="w-3 h-3" />
                            <span>Compare</span>
                          </Link>

                          <Link
                            href={`/product/${p.id}`}
                            className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white"
                            title="View Specs"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Contextual Action Bar */}
                {m.sender === "assistant" && (
                  <AIActionBar
                    context={m.recommendedProducts && m.recommendedProducts.length > 0 ? "recommendation" : undefined}
                    productId={m.recommendedProducts?.[0]?.id}
                    className="mt-2"
                  />
                )}

                {/* Tool Invocation Trace */}
                {m.tool_calls && m.tool_calls.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 space-y-1">
                    <p className="text-[10px] font-mono-data text-slate-400 uppercase tracking-wider font-semibold">
                      Executed Bounded Tools:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {m.tool_calls.map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[10px] font-mono-data bg-slate-950/60 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded"
                        >
                          <Check className="w-3 h-3 text-emerald-400" />
                          {t.tool_name}()
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Policy Decision Card */}
                {m.policy && (
                  <div
                    className={`mt-2.5 p-2.5 rounded-xl border text-xs font-mono-data ${
                      m.policy.decision === "BLOCK"
                        ? "bg-rose-950/30 border-rose-800/60 text-rose-300"
                        : "bg-emerald-950/30 border-emerald-800/60 text-emerald-300"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1">
                        {m.policy.decision === "BLOCK" ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        POLICY: {m.policy.decision}
                      </span>
                      <span className="text-[10px] uppercase">{m.policy.policy_tier}</span>
                    </div>
                    <p className="mt-1 text-[11px] opacity-90">
                      Buffer remaining: ₹{Number(
                        m.policy.remaining_buffer_inr ??
                        (m.policy.remaining_buffer_paise !== undefined && m.policy.remaining_buffer_paise !== null
                          ? m.policy.remaining_buffer_paise / 100
                          : (m.policy.max_single_transaction_paise && m.policy.cart_total_paise !== undefined
                              ? Math.max(0, m.policy.max_single_transaction_paise - m.policy.cart_total_paise) / 100
                              : 0))
                      ).toLocaleString("en-IN")}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400 italic">
                      AI has zero financial authority. Payment requires explicit buyer sign-off.
                    </p>
                  </div>
                )}

                {/* Direct Checkout Authorization Link */}
                {m.sender === "assistant" && (m.checkout_url || (m.policy && m.policy.decision === "AUTHORIZATION_REQUIRED")) && (
                  <div className="mt-2.5">
                    <Link
                      href={m.checkout_url || "/checkout/authorize"}
                      onClick={() => setIsOpen(false)}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 text-center"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Review & Authorize at Checkpoint</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1 font-mono-data">
                {m.timestamp}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono-data p-2">
              <div className="w-2 h-2 rounded-full bg-ai-glow animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-ai-glow animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-ai-glow animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1">Executing bounded commerce tools...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/90">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about laptops, noise-cancelling headphones..."
              className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-ai-violet"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-navy-900 hover:bg-ai-violet disabled:opacity-40 text-white p-2.5 rounded-xl transition flex items-center justify-center border border-slate-700"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 px-1 font-mono-data">
            <span>AI proposes. Policy verifies.</span>
            <Link href="/cart" className="text-ai-glow hover:underline flex items-center gap-1">
              <span>View Cart</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
