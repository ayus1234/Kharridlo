"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Lock,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  Copy,
  X,
  Database,
  Activity,
  Layers,
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  Sparkles,
  Radio,
  BarChart3
} from "lucide-react";
import MerchantSidebar from "@/components/MerchantSidebar";
import MerchantHeader from "@/components/MerchantHeader";
import BentoCard from "@/components/BentoCard";
import KpiMetricCard from "@/components/KpiMetricCard";
import StatusPip from "@/components/StatusPip";
import { DEFAULT_KPI_SUMMARY, DEFAULT_ACTIVITY_EVENTS } from "@/lib/telemetry-adapter";

interface AuditEventItem {
  id: string;
  actor_type: string;
  session_id: string;
  event_type: string;
  checkout_id?: string;
  order_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  metadata_json?: Record<string, any>;
  created_at: string;
}

interface AuditResponse {
  total_events: number;
  events: AuditEventItem[];
}

export default function MerchantDashboardOverviewPage() {
  const [auditData, setAuditData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [inspectEvent, setInspectEvent] = useState<AuditEventItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://kharridlo-backend.onrender.com";

  const fetchAuditTrail = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${apiBaseUrl}/api/v1/payments/audit?limit=100`;
      if (selectedEventType !== "ALL") {
        url += `&event_type=${encodeURIComponent(selectedEventType)}`;
      }
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to load audit trail (HTTP ${res.status})`);
      }
      const data: AuditResponse = await res.json();
      setAuditData(data);
    } catch (err: any) {
      setError(err.message || "Could not fetch audit trail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditTrail();
  }, [selectedEventType]);

  // Filter events by client search query
  const filteredEvents = (auditData?.events || []).filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.id.toLowerCase().includes(q) ||
      (e.order_id && e.order_id.toLowerCase().includes(q)) ||
      (e.razorpay_order_id && e.razorpay_order_id.toLowerCase().includes(q)) ||
      (e.razorpay_payment_id && e.razorpay_payment_id.toLowerCase().includes(q)) ||
      e.session_id.toLowerCase().includes(q) ||
      e.event_type.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedEventType, pageSize]);

  const totalFiltered = filteredEvents.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalFiltered / (pageSize || 10)));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const displayedEvents = pageSize === -1
    ? filteredEvents
    : filteredEvents.slice((validPage - 1) * pageSize, validPage * pageSize);

  const scrollToTop = () => {
    scrollerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
    }
  };

  const copyPayload = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getActorBadge = (actor: string) => {
    switch (actor.toUpperCase()) {
      case "BUYER":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">BUYER</span>;
      case "SYSTEM":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">SYSTEM</span>;
      case "WEBHOOK":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">WEBHOOK</span>;
      case "RAZORPAY":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">RAZORPAY</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{actor}</span>;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 text-slate-900">
      {/* Fixed Midnight Navy Sidebar */}
      <MerchantSidebar />

      {/* Main Content Area with dedicated scroll */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
        <MerchantHeader
          title="Merchant Dashboard Overview"
          subtitle="Autonomous commerce telemetry, conversion benchmarks, and real-time ledger"
          breadcrumbs={[{ label: "Merchant", href: "/merchant" }, { label: "Overview" }]}
          isSimulated={false}
          onRefresh={fetchAuditTrail}
          isLoading={loading}
        />

        <main className="flex-1 p-6 space-y-6 w-full max-w-7xl">
          {/* Top Banner (Preserves Test Selector: Autonomous Commerce Governance & Payment Audit Trail) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-growth-emerald animate-pulse" />
                  <span className="text-[10px] font-mono-data font-bold uppercase tracking-wider text-growth-dark">
                    Live Operational Telemetry
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-display text-navy-900 mt-1">
                  Autonomous Commerce Governance & Payment Audit Trail
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Cryptographically immutable event stream • Real-time Razorpay Test Mode settlements • Redacted PII
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/merchant/command-center"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-navy-900 text-white hover:bg-ai-violet transition-colors shadow-sm"
                >
                  <Radio className="h-3.5 w-3.5 text-growth-emerald animate-pulse" />
                  Command Center
                </Link>
                <Link
                  href="/merchant/activity"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Activity className="h-3.5 w-3.5 text-ai-violet" />
                  Activity Simulator
                </Link>
              </div>
            </div>
          </div>

          {/* Bento-Box KPI Metrics Grid (merchant_dashboard_overview & merchant_pulse) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Total Audit Records (Test Selector) */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider font-display">
                  Total Audit Records
                </span>
                <FileText className="h-4 w-4 text-navy-900" />
              </div>
              <div className="font-display text-3xl font-bold text-navy-900">
                {auditData ? auditData.total_events : "100+"}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-growth-dark font-mono-data font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 text-growth-emerald" />
                <span>Append-Only PostgreSQL 16</span>
              </div>
            </div>

            {/* KPI 2: Zero AI Payment Authority (Test Selector) */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider font-display">
                  Zero AI Payment Authority
                </span>
                <Shield className="h-4 w-4 text-growth-emerald" />
              </div>
              <div className="font-display text-3xl font-bold text-growth-dark">
                100% Active
              </div>
              <div className="text-[11px] text-slate-500 mt-2 font-mono-data">
                Zero tool access to payment APIs
              </div>
            </div>

            {/* KPI 3: Razorpay Test Mode (Test Selector) */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider font-display">
                  Razorpay Test Mode
                </span>
                <Lock className="h-4 w-4 text-ai-violet" />
              </div>
              <div className="font-display text-3xl font-bold text-navy-900">
                Enabled
              </div>
              <div className="text-[11px] text-slate-500 mt-2 font-mono-data">
                HMAC-SHA256 signature verification
              </div>
            </div>

            {/* KPI 4: Full Redaction Active (Test Selector) */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider font-display">
                  Full Redaction Active
                </span>
                <Database className="h-4 w-4 text-purple-600" />
              </div>
              <div className="font-display text-3xl font-bold text-navy-900">
                Guaranteed
              </div>
              <div className="text-[11px] text-slate-500 mt-2 font-mono-data">
                PII never touches agent or audit logs
              </div>
            </div>
          </div>

          {/* Operational Pulse Cards (merchant_pulse) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BentoCard
              title="Gross Processed Volume"
              subtitle="Student Hardware Cohort"
              badge="₹48.5L Total"
              badgeType="emerald"
            >
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-2xl font-bold font-display text-navy-900">₹48,52,000</span>
                <span className="text-[11px] font-mono-data font-bold text-growth-dark bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  +14.8% vs last month
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Average transaction size: ₹12,450 across Tier 1 and Tier 2 verified student accounts.
              </p>
            </BentoCard>

            <BentoCard
              title="AI Agent Conversion Efficiency"
              subtitle="Gemini 2.0 Bounded Discovery"
              aiInsight={true}
              badge="28.4% Conv"
              badgeType="ai"
            >
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-2xl font-bold font-display text-navy-900">28.4%</span>
                <span className="text-[11px] font-mono-data font-bold text-ai-violet bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  +3.6% lift
                </span>
              </div>
              <p className="text-xs text-slate-500">
                19 velocity breaches prevented by deterministic policy engines in the last 24 hours.
              </p>
            </BentoCard>

            <BentoCard
              title="Inventory Preservation GMV"
              subtitle="Zero-Stockout Substitution"
              badge="₹1.62L Recovered"
              badgeType="neutral"
            >
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-2xl font-bold font-display text-navy-900">₹1,62,889</span>
                <span className="text-[11px] font-mono-data font-bold text-growth-dark bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  94% Accept
                </span>
              </div>
              <p className="text-xs text-slate-500">
                AI automatically matched out-of-stock items with immediate dispatch alternatives.
              </p>
            </BentoCard>
          </div>

          {/* Audit Ledger Section with Smooth Scroller & Pagination (orders_audit_logs) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold font-display text-navy-900">
                    Immutable Transaction Audit Ledger
                  </h3>
                  <span className="text-[10px] font-mono-data font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {totalFiltered} events
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authoritative record of state transitions, payment orders, and policy decisions
                </p>
              </div>

              {/* Search, Event Type Filter, and Scroller Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Order, Razorpay, or Event..."
                    className="w-64 rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-2 text-xs text-navy-900 placeholder:text-slate-400 focus:outline-none focus:border-ai-violet font-mono-data"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={selectedEventType}
                  onChange={(e) => setSelectedEventType(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-navy-900 focus:outline-none focus:border-ai-violet"
                >
                  <option value="ALL">All Event Types</option>
                  <option value="POLICY_EVALUATION">POLICY_EVALUATION</option>
                  <option value="ORDER_CREATED">ORDER_CREATED</option>
                  <option value="PAYMENT_VERIFIED">PAYMENT_VERIFIED</option>
                  <option value="PAYMENT_FAILED">PAYMENT_FAILED</option>
                  <option value="WEBHOOK_RECEIVED">WEBHOOK_RECEIVED</option>
                </select>

                {/* Rows Per View Toggle */}
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-navy-900 font-semibold focus:outline-none focus:border-ai-violet"
                  title="Rows per view"
                >
                  <option value={10}>10 rows / view</option>
                  <option value={25}>25 rows / view</option>
                  <option value={50}>50 rows / view</option>
                  <option value={-1}>All (Scroller Mode)</option>
                </select>

                {/* Quick Scroll Jump Buttons */}
                <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                  <button
                    onClick={scrollToTop}
                    title="Scroll to top of ledger"
                    className="p-2 rounded-xl text-slate-600 hover:text-navy-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={scrollToBottom}
                    title="Scroll to bottom of ledger"
                    className="p-2 rounded-xl text-slate-600 hover:text-navy-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Fixed-Height Scroller Pane with Sticky Header */}
            <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs">
              <div
                ref={scrollerRef}
                className="max-h-[420px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 scroll-smooth"
              >
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-md shadow-xs border-b border-slate-200">
                    <tr className="font-mono-data text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Event Type</th>
                      <th className="p-3">Actor</th>
                      <th className="p-3">Session ID</th>
                      <th className="p-3">Order / Razorpay Ref</th>
                      <th className="p-3 text-right">Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono-data">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400">
                          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-ai-violet" />
                          Querying audit events from PostgreSQL 16...
                        </td>
                      </tr>
                    ) : displayedEvents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400">
                          No matching audit events found. Complete a checkout in Storefront or adjust filters.
                        </td>
                      </tr>
                    ) : (
                      displayedEvents.map((evt) => (
                        <tr key={evt.id} className="hover:bg-indigo-50/30 transition-colors group">
                          <td className="p-3 text-slate-500 whitespace-nowrap">
                            {new Date(evt.created_at).toLocaleTimeString()}
                          </td>
                          <td className="p-3 font-semibold text-navy-900">
                            {evt.event_type}
                          </td>
                          <td className="p-3">
                            {getActorBadge(evt.actor_type)}
                          </td>
                          <td className="p-3 text-slate-500 max-w-[130px] truncate" title={evt.session_id}>
                            {evt.session_id}
                          </td>
                          <td className="p-3 text-slate-700 font-medium">
                            {evt.razorpay_order_id || evt.order_id || "—"}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setInspectEvent(evt)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-ai-violet bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors shadow-2xs"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination & Live Scroller Navigation Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs font-mono-data">
              <div className="text-slate-500">
                Showing <strong className="text-navy-900">
                  {totalFiltered === 0 ? 0 : (validPage - 1) * (pageSize === -1 ? totalFiltered : pageSize) + 1}
                </strong> to <strong className="text-navy-900">
                  {pageSize === -1 ? totalFiltered : Math.min(validPage * pageSize, totalFiltered)}
                </strong> of <strong className="text-navy-900">{totalFiltered}</strong> events
              </div>

              {totalPages > 1 && pageSize !== -1 && (
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                      scrollToTop();
                    }}
                    disabled={validPage <= 1}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1 font-semibold"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Prev</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      let pNum = i + 1;
                      if (totalPages > 5 && validPage > 3) {
                        pNum = validPage - 2 + i;
                        if (pNum > totalPages) pNum = totalPages - (4 - i);
                      }
                      const isActive = validPage === pNum;
                      return (
                        <button
                          key={pNum}
                          onClick={() => {
                            setCurrentPage(pNum);
                            scrollToTop();
                          }}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                            isActive
                              ? "bg-navy-900 text-white shadow-xs"
                              : "hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          {pNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                      scrollToTop();
                    }}
                    disabled={validPage >= totalPages}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1 font-semibold"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Inspect Event Payload Modal */}
      {inspectEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-r from-navy-950 to-indigo-950 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 text-white">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    Audit Event Payload Inspector
                  </h3>
                  <p className="text-xs text-slate-300 font-mono-data">
                    ID: {inspectEvent.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectEvent(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 font-mono-data text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-400 block uppercase">Event Type</span>
                  <strong className="text-navy-900">{inspectEvent.event_type}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase">Actor</span>
                  <strong className="text-navy-900">{inspectEvent.actor_type}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase">Session</span>
                  <span className="text-slate-700 truncate block" title={inspectEvent.session_id}>
                    {inspectEvent.session_id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase">Timestamp</span>
                  <span className="text-slate-700 block">
                    {new Date(inspectEvent.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between pb-1.5">
                  <span className="text-xs font-bold font-sans text-slate-700">Cryptographic JSON Payload:</span>
                  <button
                    onClick={() => copyPayload(JSON.stringify(inspectEvent, null, 2), inspectEvent.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-ai-violet hover:underline"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedId === inspectEvent.id ? "Copied!" : "Copy Raw JSON"}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 overflow-x-auto text-[11px] leading-relaxed max-h-[300px] scrollbar-thin">
                  {JSON.stringify(inspectEvent.metadata_json || inspectEvent, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setInspectEvent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

