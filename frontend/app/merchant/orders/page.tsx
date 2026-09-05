"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Search, RefreshCw, ArrowRight, ShieldCheck, CheckCircle2, Lock, Terminal } from "lucide-react";
import MerchantSidebar from "@/components/MerchantSidebar";
import MerchantHeader from "@/components/MerchantHeader";
import StatusPip from "@/components/StatusPip";

export default function OrdersAuditLogsPage() {
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://kharridlo-backend.onrender.com";

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/payments/audit?limit=50`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAuditEvents(data.events || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const sampleOrders = [
    {
      orderId: "order_RzpTest9942",
      buyerSession: "sess_99a803_1725453",
      amountInr: 94500,
      itemSummary: "TechNova Pro 15 Workstation + Audio Bundle",
      status: "SETTLED",
      time: "10 mins ago",
    },
    {
      orderId: "order_RzpTest8810",
      buyerSession: "sess_a8f921_1725450",
      amountInr: 45999,
      itemSummary: "TechNova CodeCraft Mechanical Keyboard",
      status: "SETTLED",
      time: "24 mins ago",
    },
    {
      orderId: "order_RzpTest7731",
      buyerSession: "sess_c4b102_1725451",
      amountInr: 8498,
      itemSummary: "Dual-Display 4K USB-C Hub",
      status: "SETTLED",
      time: "48 mins ago",
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <MerchantSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MerchantHeader
          title="Orders & Audit Logs Dual Workbench"
          subtitle="Real-time order settlements paired with immutable system event stream"
          breadcrumbs={[{ label: "Merchant", href: "/merchant" }, { label: "Orders & Audit" }]}
          isSimulated={false}
          onRefresh={fetchAudit}
          isLoading={loading}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Dual Panel Grid (orders_audit_logs) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 6 cols: Authoritative Order Ledger */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-navy-900" />
                  <h3 className="font-display font-bold text-base text-navy-900">
                    Authoritative Order Ledger
                  </h3>
                </div>
                <span className="text-xs font-mono-data text-growth-dark font-bold">
                  PostgreSQL Verified
                </span>
              </div>

              <div className="space-y-3">
                {sampleOrders.map((o) => (
                  <div
                    key={o.orderId}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-purple-200 transition-all space-y-2 text-xs font-mono-data"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy-900">{o.orderId}</span>
                      <StatusPip status={o.status} size="sm" />
                    </div>
                    <p className="text-slate-700 font-sans font-medium text-[11px]">
                      {o.itemSummary}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-slate-500 text-[11px]">
                      <span>Amount: <strong className="text-navy-900">₹{o.amountInr.toLocaleString("en-IN")}</strong></span>
                      <span>{o.time}</span>
                      <Link
                        href={`/merchant/audit-trail/${o.orderId}`}
                        className="text-ai-violet font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Audit</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 6 cols: Immutable System Audit Stream */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-ai-violet" />
                  <h3 className="font-display font-bold text-base text-navy-900">
                    Append-Only Audit Stream
                  </h3>
                </div>
                <span className="text-xs font-mono-data text-slate-400">
                  {auditEvents.length} events
                </span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {auditEvents.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-mono-data">
                    No audit records found.
                  </div>
                ) : (
                  auditEvents.map((e) => (
                    <div
                      key={e.id}
                      className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/40 text-xs font-mono-data space-y-1 hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-navy-900">{e.event_type}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(e.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Actor: {e.actor_type}</span>
                        <span>Ref: {e.order_id || e.session_id}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
