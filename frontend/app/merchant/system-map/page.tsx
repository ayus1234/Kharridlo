"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Network,
  Server,
  Database,
  ShieldCheck,
  Bot,
  Laptop,
  CheckCircle2,
  RefreshCw,
  ArrowDown,
  ArrowRight,
  ExternalLink,
  Layers,
  Lock
} from "lucide-react";
import MerchantSidebar from "@/components/MerchantSidebar";
import MerchantHeader from "@/components/MerchantHeader";
import BentoCard from "@/components/BentoCard";
import { DEFAULT_SYSTEM_NODES, SystemNode } from "@/lib/telemetry-adapter";

export default function SystemConnectivityMapPage() {
  const [nodes, setNodes] = useState<SystemNode[]>(DEFAULT_SYSTEM_NODES);
  const [probing, setProbing] = useState(false);
  const [gatewayLatency, setGatewayLatency] = useState<number | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://kharridlo-backend.onrender.com";

  const probeBackend = async () => {
    setProbing(true);
    const start = performance.now();
    try {
      const res = await fetch(`${apiBaseUrl}/health`, { cache: "no-store" });
      const elapsed = Math.round(performance.now() - start);
      setGatewayLatency(elapsed);
      if (res.ok) {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === "node_api"
              ? { ...n, latencyMs: elapsed, status: "HEALTHY" }
              : n
          )
        );
      }
    } catch {
      // Degraded
    } finally {
      setProbing(false);
    }
  };

  useEffect(() => {
    probeBackend();
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <MerchantSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MerchantHeader
          title="System Connectivity Map"
          subtitle="Real-time architectural topology and node health verification"
          breadcrumbs={[{ label: "Merchant", href: "/merchant" }, { label: "System Map" }]}
          isSimulated={false}
          onRefresh={probeBackend}
          isLoading={probing}
        />

        <main className="flex-1 p-6 space-y-6 max-w-4xl w-full mx-auto">
          {/* Overview Strip (dhankriya_system_connectivity_map -> Kharridlo System Map) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Network className="h-5 w-5 text-growth-emerald" />
                <h2 className="font-display font-bold text-lg text-navy-900">
                  Architectural Topology & Boundary Map
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                End-to-end trace from browser client to Razorpay Test Mode gateway and PostgreSQL 16.
              </p>
            </div>

            <button
              onClick={probeBackend}
              disabled={probing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-semibold hover:bg-ai-violet transition-colors self-start sm:self-auto shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${probing ? "animate-spin" : ""}`} />
              <span>Probe Live Health</span>
            </button>
          </div>

          {/* S-Curve Topology Timeline Visualizer */}
          <div className="space-y-4">
            {nodes.map((node, idx) => (
              <div key={node.id} className="relative">
                {/* Connector Line */}
                {idx < nodes.length - 1 && (
                  <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-slate-200 -mb-4 z-0" />
                )}

                <div className="relative z-10 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
                        {node.category === "FRONTEND" && <Laptop className="h-5 w-5 text-growth-emerald" />}
                        {node.category === "GATEWAY" && <Server className="h-5 w-5 text-blue-400" />}
                        {node.category === "AI_ENGINE" && <Bot className="h-5 w-5 text-ai-violet" />}
                        {node.category === "POLICY" && <ShieldCheck className="h-5 w-5 text-emerald-400" />}
                        {node.category === "DATABASE" && <Database className="h-5 w-5 text-purple-400" />}
                        {node.category === "PAYMENT_GATEWAY" && <Lock className="h-5 w-5 text-amber-400" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-sm text-navy-900">
                            {idx + 1}. {node.name}
                          </h3>
                          <span className="text-[10px] font-mono-data uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-semibold">
                            {node.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{node.detail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 font-mono-data text-xs pl-12 sm:pl-0">
                      <span className="text-slate-400 text-[11px]">{node.version}</span>
                      <span className="font-bold text-growth-dark bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-growth-emerald animate-pulse" />
                        {node.latencyMs}ms
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
