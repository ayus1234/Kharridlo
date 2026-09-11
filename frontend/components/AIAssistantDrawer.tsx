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
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  tool_calls?: ToolCall[];
  policy?: any;
  cart?: any;
  recommendedProducts?: ProductRecommendation[];
  requirements?: ShoppingRequirements | null;
  execution_mode?: string;
  model?: string;
  timestamp: string;
}

interface AIAssistantDrawerProps {
  onCartUpdated?: () => void;
}

const QUICK_PROMPTS = [
  "Find me a coding laptop under ₹70k",
  "Noise-cancelling headphones for study",
  "Mechanical keyboard for dorm",
  "Compare developer monitors",
  "What is in my cart?",
];

export default function AIAssistantDrawer({ onCartUpdated }: AIAssistantDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [activeRequirements, setActiveRequirements] = useState<ShoppingRequirements | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I am your Kharridlo AI Shopping Companion, powered by Gemini 2.0 with 7 bounded tools. Tell me your major, budget, or hardware specs, and I'll find the ideal match.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccessId, setActionSuccessId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
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
      });
    };

    if (Array.isArray(data.recommended_products)) {
      data.recommended_products.forEach(addCandidate);
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

    return products.slice(0, 3);
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
    if (parsedReqs) {
      setActiveRequirements(parsedReqs);
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
        }),
      });

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const data = await res.json();
      const extractedProds = extractProductsFromResponse(data);

      const assistantMessage: Message = {
        id: `asst_${Date.now()}`,
        sender: "assistant",
        text: data.message || data.reply || "I have analyzed your request against our verified catalog.",
        tool_calls: data.tool_calls,
        policy: data.policy,
        cart: data.cart,
        recommendedProducts: extractedProds,
        execution_mode: data.execution_mode,
        model: data.model,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If tool mutated cart, notify parent
      if (data.cart || (data.tool_calls && data.tool_calls.some((t: ToolCall) => t.tool_name === "add_to_cart" || t.tool_name === "remove_from_cart"))) {
        if (onCartUpdated) onCartUpdated();
      }
    } catch (err: any) {
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
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-[10px] font-mono-data uppercase text-purple-300 font-bold">
                Active Intent:
              </span>
              <button
                onClick={() => setActiveRequirements(null)}
                className="text-[10px] text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px] font-semibold border border-slate-700">
                {activeRequirements.category}
              </span>
              {activeRequirements.budgetInr && (
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 text-[11px] font-mono-data font-bold border border-emerald-800/60">
                  ≤ ₹{activeRequirements.budgetInr.toLocaleString("en-IN")}
                </span>
              )}
              {activeRequirements.useCase && (
                <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 text-[11px] font-medium border border-purple-800/60">
                  {activeRequirements.useCase}
                </span>
              )}
            </div>
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

                {/* Contextual Product Recommendations Inside Chat */}
                {m.recommendedProducts && m.recommendedProducts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/70 space-y-2">
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
                            <h5 className="text-xs font-bold text-white line-clamp-1">
                              {p.name}
                            </h5>
                            <span className="text-[10px] font-mono-data text-slate-400 block">
                              {p.brand} • {p.category}
                            </span>
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
                      Buffer remaining: ₹{(m.policy.remaining_buffer_paise / 100).toLocaleString("en-IN")}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400 italic">
                      AI has zero financial authority. Payment requires explicit buyer sign-off.
                    </p>
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
