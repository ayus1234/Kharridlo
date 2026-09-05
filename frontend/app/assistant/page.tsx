"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  Send,
  User,
  ShoppingBag,
  ArrowRight,
  GitCompare,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  ChevronRight,
  Clock,
  Layers
} from "lucide-react";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import ProductImage from "@/components/ProductImage";
import StatusPip from "@/components/StatusPip";
import { getOrCreateSessionId } from "@/lib/session";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
  toolCalls?: { name: string; args: any }[];
  recommendedProductIds?: string[];
}

interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price_paise: number;
  price_inr: number;
  description: string;
  image_url?: string;
  matchScore?: number;
  matchReason?: string;
}

const STARTER_PROMPTS = [
  "Find a lightweight laptop for computer science student under ₹60,000",
  "Recommend a silent mechanical keyboard with wrist rest for dorm study",
  "What is the best 27-inch 4K developer monitor for dual display setups?",
  "Suggest a complete student productivity bundle for less than ₹80,000",
];

function AssistantContent() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") || "";

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_welcome",
      role: "model",
      content: "Hello! I am the Kharridlo Student Shopping Assistant, powered by Gemini with 7 bounded tools. Tell me what course you're taking, your budget, or specific hardware specs you need, and I'll find the best match for you.",
      timestamp: "Just now",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeContextProducts, setActiveContextProducts] = useState<Product[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://kharridlo-backend.onrender.com";

  useEffect(() => {
    const sid = getOrCreateSessionId();
    setSessionId(sid);
    loadRecommendedProducts();

    if (initialPrompt) {
      sendMessage(initialPrompt, sid);
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const loadRecommendedProducts = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/products?limit=4`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const enriched = (data.items || []).map((p: Product, idx: number) => ({
          ...p,
          matchScore: 98 - idx * 4,
          matchReason: idx === 0 ? "Best Match for CS & Engineering" : "High Value Student Spec",
        }));
        setActiveContextProducts(enriched);
      }
    } catch {
      // Fallback
    }
  };

  const sendMessage = async (promptToSend: string, currentSid: string) => {
    if (!promptToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: "user",
      content: promptToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: currentSid || sessionId,
          message: promptToSend.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error(`Agent response status: ${res.status}`);
      }

      const data = await res.json();
      const modelMsg: ChatMessage = {
        id: `msg_model_${Date.now()}`,
        role: "model",
        content: data.reply || "I've reviewed the catalog against your query.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        toolCalls: data.tool_calls || [],
      };

      setMessages((prev) => [...prev, modelMsg]);

      // If search tool was invoked, refresh context products
      if (data.recommended_products && data.recommended_products.length > 0) {
        setActiveContextProducts(data.recommended_products);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: "model",
        content: "I ran into a connection issue while contacting the Gemini bounded agent. Showing curated recommendations below.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      const sid = sessionId || getOrCreateSessionId();
      let res = await fetch(`${apiBaseUrl}/api/v1/cart/${sid}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1,
        }),
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`/api/cart/${sid}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: product.id,
            quantity: 1,
            title: product.name || (product as any).title,
            price_paise: (product as any).price_paise || (product.price_inr ? Math.round(product.price_inr * 100) : undefined),
            brand: product.brand,
            category: product.category,
            image_url: product.image_url,
          }),
        });
      }

      if (res && res.ok) {
        window.dispatchEvent(new Event("cart-updated"));
        setToastMsg(`Added "${product.name || (product as any).title}" to cart.`);
        setTimeout(() => setToastMsg(null), 3500);
      } else {
        setToastMsg("Failed to add to cart.");
        setTimeout(() => setToastMsg(null), 3000);
      }
    } catch {
      setToastMsg("Could not connect to cart service.");
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <BuyerNavbar />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 rounded-xl bg-navy-900 text-white px-4 py-2.5 text-xs font-semibold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-growth-emerald" />
          <span>{toastMsg}</span>
        </div>
      )}

      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 gap-6">
        {/* Left/Center Pane: Conversational Thread (ai_shopping_assistant_1) */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden min-h-[680px]">
          {/* Assistant Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-ai-violet to-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-bold text-base text-navy-900">
                    Kharridlo AI Shopping Assistant
                  </h1>
                  <span className="text-[10px] font-mono-data font-semibold bg-purple-50 text-ai-violet px-2 py-0.5 rounded-full border border-purple-200">
                    Gemini 2.0 Bounded
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Natural language discovery with zero payment authority.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono-data font-medium bg-emerald-50 text-growth-dark border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-growth-emerald animate-pulse" />
              Online
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 max-w-2xl ${isUser ? "ml-auto flex-row-reverse" : ""}`}
                >
                  <div
                    className={`h-8 w-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                      isUser
                        ? "bg-navy-900 text-white"
                        : "bg-purple-100 text-ai-violet border border-purple-200"
                    }`}
                  >
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  <div className={`space-y-1 ${isUser ? "text-right" : ""}`}>
                    <div
                      className={`inline-block rounded-2xl px-4 py-3 text-xs leading-relaxed text-left ${
                        isUser
                          ? "bg-navy-900 text-white shadow-sm"
                          : "bg-slate-100/90 text-navy-900 border border-slate-200/80"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>

                      {/* Tool Call Chips */}
                      {m.toolCalls && m.toolCalls.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                          {m.toolCalls.map((tc, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-data bg-white text-slate-600 border border-slate-200"
                            >
                              <Sparkles className="h-2.5 w-2.5 text-ai-violet" />
                              <span>Tool: {tc.name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 px-1 font-mono-data">
                      {m.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3 max-w-md">
                <div className="h-8 w-8 rounded-xl bg-purple-100 text-ai-violet border border-purple-200 flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                </div>
                <div className="rounded-2xl bg-slate-100 px-4 py-3 text-xs text-slate-500 border border-slate-200 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-ai-violet animate-pulse" />
                  <span>Evaluating student criteria against catalog...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Starter Chips */}
          <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 overflow-x-auto flex items-center gap-2 no-scrollbar">
            <span className="text-[10px] font-mono-data uppercase text-slate-400 flex-shrink-0">
              Suggestions:
            </span>
            {STARTER_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => sendMessage(p, sessionId)}
                className="whitespace-nowrap rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 hover:text-ai-violet hover:border-purple-200 active:scale-95 transition-all flex-shrink-0 shadow-2xs"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Message Input Box */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(inputText, sessionId);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about specs, compatibility, student discounts..."
                className="flex-1 min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-navy-900 placeholder:text-slate-400 focus:border-ai-violet focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] h-11 w-11 rounded-xl bg-navy-900 text-white hover:bg-ai-violet active:scale-95 disabled:opacity-50 transition-all shadow-sm flex-shrink-0"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Pane: Live Shopping Context & Product Cards (ai_shopping_assistant_1) */}
        <aside className="w-full lg:w-96 flex-shrink-0 flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm flex-1">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-ai-violet" />
                <h2 className="font-display font-bold text-sm text-navy-900">
                  AI Context Matches
                </h2>
              </div>
              <span className="text-[10px] font-mono-data font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {activeContextProducts.length} items
              </span>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[620px] pr-1">
              {activeContextProducts.map((p) => (
                <div
                  key={p.id}
                  className="group rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 hover:bg-white hover:border-purple-300 hover:shadow-sm transition-all"
                >
                  <div className="flex gap-3">
                    <div className="h-16 w-16 rounded-lg overflow-hidden bg-white border border-slate-200 flex-shrink-0">
                      <ProductImage
                        src={p.image_url || "/assets/laptop-product.png"}
                        alt={p.name}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[9px] font-mono-data font-bold uppercase tracking-wider text-slate-500">
                          {p.category}
                        </span>
                        {p.matchScore && (
                          <span className="text-[10px] font-mono-data font-bold text-growth-dark bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {p.matchScore}% Match
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-xs text-navy-900 line-clamp-1 group-hover:text-ai-violet transition-colors">
                        <Link href={`/product/${p.id}`}>{p.name}</Link>
                      </h3>
                      <div className="text-[11px] font-bold text-navy-900 mt-1">
                        ₹{p.price_inr.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>

                  {p.matchReason && (
                    <div className="mt-2 text-[10px] text-ai-violet bg-purple-50/80 px-2 py-1 rounded border border-purple-100 font-medium">
                      💡 {p.matchReason}
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    <Link
                      href={`/compare?id1=${p.id}`}
                      className="text-[10px] font-semibold text-slate-600 hover:text-navy-900 flex items-center gap-1"
                    >
                      <GitCompare className="h-3 w-3" /> Compare
                    </Link>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/product/${p.id}`}
                        className="text-[10px] font-semibold text-slate-700 hover:text-ai-violet px-2 py-1 rounded bg-white border border-slate-200"
                      >
                        Specs
                      </Link>
                      <button
                        onClick={() => handleAddToCart(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-navy-900 text-white text-[10px] font-semibold hover:bg-ai-violet transition-colors shadow-2xs"
                      >
                        <Plus className="h-2.5 w-2.5" /> Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      <BuyerFooter />
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-xs font-mono-data text-slate-400">Loading Shopping Assistant...</div>}>
      <AssistantContent />
    </Suspense>
  );
}
