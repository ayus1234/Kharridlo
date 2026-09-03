"use client";

import { useEffect, useState } from "react";
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
  Database,
  Activity,
  Layers,
  FileText
} from "lucide-react";

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

export default function MerchantAuditPage() {
  const [auditData, setAuditData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{actor}</span>;
    }
  };

  const getEventBadge = (eventType: string) => {
    if (eventType.includes("CAPTURED") || eventType.includes("SUCCESS")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> {eventType}
        </span>
      );
    }
    if (eventType.includes("FAILED") || eventType.includes("BLOCKED")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3" /> {eventType}
        </span>
      );
    }
    if (eventType.includes("CANCELLED")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3" /> {eventType}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
        <Activity className="w-3 h-3" /> {eventType}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">Kharridlo</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  MERCHANT AUDIT
                </span>
              </div>
              <p className="text-xs text-slate-500">Autonomous Commerce Governance & Payment Audit Trail</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/catalog"
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Catalog
            </Link>
            <Link
              href="/cart"
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cart
            </Link>
            <button
              onClick={fetchAuditTrail}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI / Security Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Audit Records</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{auditData?.total_events ?? 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">Immutable PostgreSQL records</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Boundary Status</span>
            <div className="text-sm font-bold text-emerald-700 mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Zero AI Payment Authority
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Strict server-side orchestration</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gateway Integration</span>
            <div className="text-sm font-bold text-indigo-700 mt-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              Razorpay Test Mode
            </div>
            <p className="text-[11px] text-slate-500 mt-1">HMAC-SHA256 signature verified</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Secret Security</span>
            <div className="text-sm font-bold text-purple-700 mt-2 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-purple-600" />
              Full Redaction Active
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Zero secrets leaked in UI/logs</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID, Payment ID, Session..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Event Type Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Event:</span>
            {[
              { label: "All Events", value: "ALL" },
              { label: "Orders Created", value: "ORDER_CREATED" },
              { label: "Buyer Confirmed", value: "BUYER_CONFIRMED" },
              { label: "Captured Payments", value: "PAYMENT_CAPTURED" },
              { label: "Webhooks", value: "WEBHOOK_PROCESSED" },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedEventType(filter.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedEventType === filter.value
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">Governance & Payment Audit Timeline</h3>
            </div>
            <span className="text-xs text-slate-500">
              Showing {filteredEvents.length} of {auditData?.total_events ?? 0} events
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
              <span className="text-xs font-medium">Loading audit events...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-600 text-xs">
              <p className="font-bold">Error loading audit trail</p>
              <p className="mt-1">{error}</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No audit events found matching the criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Event Type</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Internal Order ID</th>
                    <th className="px-4 py-3">Razorpay Order / Payment ID</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredEvents.map((e) => {
                    const isExpanded = expandedEventId === e.id;
                    const dateStr = new Date(e.created_at).toLocaleString();
                    return (
                      <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-sans text-xs">
                          {dateStr}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-sans">
                          {getEventBadge(e.event_type)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-sans">
                          {getActorBadge(e.actor_type)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-800">
                          {e.order_id ? (
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-bold text-slate-700">
                              {e.order_id.slice(0, 8)}...
                            </span>
                          ) : (
                            <span className="text-slate-400 font-sans">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {e.razorpay_payment_id ? (
                            <div className="text-[11px] text-indigo-700 font-bold">
                              {e.razorpay_payment_id}
                            </div>
                          ) : e.razorpay_order_id ? (
                            <div className="text-[11px] text-slate-700">
                              {e.razorpay_order_id}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-sans">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-sans">
                          <button
                            onClick={() => setExpandedEventId(isExpanded ? null : e.id)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
                          >
                            {isExpanded ? "Hide" : "Inspect"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal / Detailed JSON Inspector */}
        {expandedEventId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-bold text-sm text-slate-900">Audit Record Inspector</h4>
                <button
                  onClick={() => setExpandedEventId(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700"
                >
                  ✕ Close
                </button>
              </div>

              {(() => {
                const event = auditData?.events.find((ev) => ev.id === expandedEventId);
                if (!event) return null;
                return (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                      <div><strong className="text-slate-900">Event ID:</strong> {event.id}</div>
                      <div><strong className="text-slate-900">Actor:</strong> {event.actor_type}</div>
                      <div><strong className="text-slate-900">Event Type:</strong> {event.event_type}</div>
                      <div><strong className="text-slate-900">Session ID:</strong> {event.session_id}</div>
                      <div><strong className="text-slate-900">Order ID:</strong> {event.order_id || "N/A"}</div>
                      <div><strong className="text-slate-900">Razorpay Order:</strong> {event.razorpay_order_id || "N/A"}</div>
                      <div><strong className="text-slate-900">Razorpay Payment:</strong> {event.razorpay_payment_id || "N/A"}</div>
                      <div><strong className="text-slate-900">Timestamp:</strong> {new Date(event.created_at).toISOString()}</div>
                    </div>

                    <div className="pt-2">
                      <span className="font-bold text-slate-900 block mb-1">Sanitized Metadata:</span>
                      <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto">
                        {JSON.stringify(event.metadata_json || {}, null, 2)}
                      </pre>
                    </div>

                    <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-[11px] flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Zero secrets or authentication tokens are stored in this record.</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
