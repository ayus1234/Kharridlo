"use client";

import { useState, useEffect, useRef } from "react";
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
  Bot
} from "lucide-react";
import { getOrCreateSessionId } from "@/lib/session";

interface ToolCall {
  tool_name: string;
  arguments: Record<string, any>;
  result: Record<string, any>;
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  tool_calls?: ToolCall[];
  policy?: any;
  cart?: any;
  execution_mode?: string;
  model?: string;
  timestamp: string;
}

interface AIAssistantDrawerProps {
  onCartUpdated?: () => void;
}

const QUICK_PROMPTS = [
  "I need a laptop for development under 70000",
  "Add DK-LP-15 to my cart",
  "Can I buy it?",
  "Add DK-LP-ULTRA to my cart",
  "What's in my cart?",
];

export default function AIAssistantDrawer({ onCartUpdated }: AIAssistantDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I am your Kharridlo Commerce Assistant. I can help you find products, manage your cart, and evaluate transaction policies before payment.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendMessage = async (textToSend?: string) => {
    const messageText = textToSend || inputValue.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputValue("");
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/agent/chat`, {
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

      const assistantMessage: Message = {
        id: `asst_${Date.now()}`,
        sender: "assistant",
        text: data.message,
        tool_calls: data.tool_calls,
        policy: data.policy,
        cart: data.cart,
        execution_mode: data.execution_mode,
        model: data.model,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If tool mutated or checked cart, notify parent to refresh cart indicator
      if (data.cart || (data.tool_calls && data.tool_calls.some((t: ToolCall) => t.tool_name === "add_to_cart" || t.tool_name === "remove_from_cart"))) {
        if (onCartUpdated) onCartUpdated();
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "assistant",
          text: "I am having trouble communicating with the commerce service right now. Please ensure the backend server is running on port 8000.",
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
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white px-4 py-3 rounded-full shadow-xl shadow-emerald-900/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 font-medium text-sm"
        aria-label="Open Kharridlo AI Assistant"
      >
        <Sparkles className="w-5 h-5 text-emerald-200 animate-pulse" />
        <span>Kharridlo Assistant</span>
      </button>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity"
        />
      )}

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-base">Kharridlo Assistant</h3>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold tracking-wider">
                  M5 Bounded
                </span>
              </div>
              <p className="text-xs text-slate-400">
                AI proposes. Deterministic systems verify and authorize.
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

        {/* Quick Prompts Carousel */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-900/50 overflow-x-auto no-scrollbar flex gap-2">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(prompt)}
              disabled={isLoading}
              className="text-xs whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-md border border-slate-700/60 transition flex items-center gap-1 disabled:opacity-50"
            >
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
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.sender === "user"
                    ? "bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-950/30"
                    : "bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-bl-none"
                }`}
              >
                {m.sender === "assistant" && m.execution_mode && (
                  <div className="mb-2">
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
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
                        ? `Live: ${m.model || "Gemini 2.5 Flash"}`
                        : "Deterministic Fallback Engine"}
                    </span>
                  </div>
                )}
                <p className="whitespace-pre-line">{m.text}</p>

                {/* Tool Invocation Trace */}
                {m.tool_calls && m.tool_calls.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 space-y-1">
                    <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                      Executed Bounded Tools:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {m.tool_calls.map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[11px] font-mono bg-slate-950/60 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded"
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
                    className={`mt-2.5 p-2.5 rounded-lg border text-xs font-mono ${
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
                      Payment has not been initiated.
                    </p>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1 font-mono">
                {m.timestamp}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono p-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
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
              placeholder="Ask about products, cart, or limits..."
              className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white p-2.5 rounded-xl transition flex items-center justify-center"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-slate-500 text-center mt-2">
            AI bounded by deterministic policy. No financial authority or payment execution.
          </p>
        </div>
      </div>
    </>
  );
}
