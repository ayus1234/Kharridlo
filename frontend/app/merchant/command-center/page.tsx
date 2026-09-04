"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Radio,
  Shield,
  Activity,
  Users,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Sparkles,
  Zap,
  Power,
  RotateCcw,
  Sliders,
  Server
} from "lucide-react";
import MerchantSidebar from "@/components/MerchantSidebar";
import MerchantHeader from "@/components/MerchantHeader";
import BentoCard from "@/components/BentoCard";
import KpiMetricCard from "@/components/KpiMetricCard";
import StatusPip from "@/components/StatusPip";
import { DEFAULT_ACTIVE_SESSIONS, DEFAULT_ACTIVITY_EVENTS, DEFAULT_SYSTEM_NODES } from "@/lib/telemetry-adapter";

export default function AICommerceCommandCenterPage() {
  const [activeSessions, setActiveSessions] = useState(DEFAULT_ACTIVE_SESSIONS);
  const [killSwitchActive, setKillSwitchActive] = useState(false);
  const [strictTier1Auth, setStrictTier1Auth] = useState(true);
  const [velocityThrottle, setVelocityThrottle] = useState(false);
  const [events, setEvents] = useState(DEFAULT_ACTIVITY_EVENTS);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <MerchantSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MerchantHeader
          title="AI Commerce Command Center"
          subtitle="Real-time operations mission control: agent activity radar, bottleneck monitors, and policy switches"
          breadcrumbs={[{ label: "Merchant", href: "/merchant" }, { label: "Command Center" }]}
          isSimulated={true}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Mission Control Top Alert Strip */}
          <div className="rounded-2xl border border-slate-200 bg-navy-900 p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-ai-violet/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-growth-emerald animate-ping" />
                  <span className="text-[10px] font-mono-data uppercase tracking-widest text-emerald-400 font-bold">
                    Mission Control Online • Zero AI Payment Authority Enforced
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">
                  Real-Time Autonomous Agent Operations Radar
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Monitoring {activeSessions.length} active student reasoning sessions. Bounded tool sandbox active with 100% policy verification rate.
                </p>
              </div>

              {/* Emergency Policy Switches */}
              <div className="flex items-center gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800 font-mono-data text-xs">
                <div className="text-left pr-3 border-r border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Killswitch</span>
                  <span className={killSwitchActive ? "text-rose-400 font-bold" : "text-growth-emerald font-semibold"}>
                    {killSwitchActive ? "ENGAGED" : "ARMED"}
                  </span>
                </div>
                <button
                  onClick={() => setKillSwitchActive(!killSwitchActive)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors ${
                    killSwitchActive
                      ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                  }`}
                >
                  <Power className="h-3.5 w-3.5" />
                  <span>{killSwitchActive ? "Resume Agent" : "Halt Agent"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Radar Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiMetricCard
              title="Active Buyer Radar"
              value={`${activeSessions.length} Sessions`}
              trend="+4 in last 5m"
              trendPositive={true}
              subtext="Average latency 18ms"
              icon={Users}
            />
            <KpiMetricCard
              title="Agent Velocity"
              value="142 calls/min"
              trend="Nominal"
              trendPositive={true}
              subtext="Bounded tool execution"
              icon={Zap}
            />
            <KpiMetricCard
              title="Interception Rate"
              value="99.98%"
              trend="Zero Leaks"
              trendPositive={true}
              subtext="19 blocked attempts"
              icon={Shield}
            />
            <KpiMetricCard
              title="System Uptime"
              value="100.0%"
              trend="All Nodes Healthy"
              trendPositive={true}
              subtext="FastAPI + PostgreSQL"
              icon={Server}
            />
          </div>

          {/* Active Intent Radar & Emergency Switches (2 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 cols: Live Buyer Intent Stream */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-ai-violet animate-pulse" />
                    <h3 className="text-base font-bold font-display text-navy-900">
                      Live Student Intent Radar
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono-data text-slate-400 uppercase tracking-wider">
                    Auto-Refreshing (WebSocket Simulated)
                  </span>
                </div>

                <div className="space-y-3">
                  {activeSessions.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-purple-300 transition-all font-mono-data text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-sans font-bold text-navy-900">
                          <span>{s.studentTier}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-xs text-slate-500 font-mono-data">{s.sessionId}</span>
                        </div>
                        <StatusPip status={s.currentStep} size="sm" />
                      </div>

                      <p className="text-xs font-sans text-slate-700 italic">
                        &quot;{s.intentPrompt}&quot;
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                        <span>Cart Total: <strong className="text-navy-900">₹{s.cartTotalInr.toLocaleString("en-IN")}</strong> ({s.cartItemCount} items)</span>
                        <span className="flex items-center gap-1">
                          Risk Score: 
                          <span className={`font-bold ${s.riskScore > 60 ? "text-rose-600" : "text-growth-dark"}`}>
                            {s.riskScore}/100
                          </span>
                        </span>
                        <span>Active: {s.lastActive}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 1 col: Operational Policy Switches */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Sliders className="h-4 w-4 text-navy-900" />
                  <h3 className="font-display font-bold text-sm text-navy-900">
                    Policy Enforcement Controls
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Switch 1: Strict Tier 1 Auth */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="font-semibold text-navy-900 block">Strict Tier 1 Auth</span>
                      <span className="text-[11px] text-slate-500">Force biometric approval above ₹5k</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={strictTier1Auth}
                      onChange={(e) => setStrictTier1Auth(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-ai-violet focus:ring-ai-violet"
                    />
                  </div>

                  {/* Switch 2: Velocity Throttle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="font-semibold text-navy-900 block">Velocity Throttling</span>
                      <span className="text-[11px] text-slate-500">Cap tool queries to 30/min per IP</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={velocityThrottle}
                      onChange={(e) => setVelocityThrottle(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-ai-violet focus:ring-ai-violet"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <Link
                    href="/merchant/policies"
                    className="text-xs font-bold text-ai-violet hover:underline flex items-center justify-between"
                  >
                    <span>Configure Full Policy Matrix</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              {/* Node Latency Summary */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">
                  Node Latency Breakdown
                </h4>
                <div className="space-y-2 font-mono-data text-xs">
                  {DEFAULT_SYSTEM_NODES.slice(0, 4).map((node) => (
                    <div key={node.id} className="flex items-center justify-between py-1 border-b border-slate-100 text-[11px]">
                      <span className="text-slate-600 truncate max-w-[160px]">{node.name}</span>
                      <span className="font-bold text-growth-dark">{node.latencyMs}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
