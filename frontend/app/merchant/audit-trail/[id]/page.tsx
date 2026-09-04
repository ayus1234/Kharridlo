"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, CheckCircle2, Lock, Terminal, FileText, Database } from "lucide-react";
import MerchantSidebar from "@/components/MerchantSidebar";
import MerchantHeader from "@/components/MerchantHeader";

export default function TransactionAuditTrailDetailPage() {
  const params = useParams();
  const txId = (params?.id as string) || "order_RzpTest9942";

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <MerchantSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MerchantHeader
          title="Transaction Audit Trail Inspector"
          subtitle={`Cryptographic verification & immutable ledger provenance for ${txId}`}
          breadcrumbs={[
            { label: "Merchant", href: "/merchant" },
            { label: "Orders & Audit", href: "/merchant/orders" },
            { label: "Transaction Audit" },
          ]}
          isSimulated={true}
        />

        <main className="flex-1 p-6 space-y-6 max-w-4xl w-full mx-auto">
          {/* Detail Card (transaction_audit_trail) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <Link
                href="/merchant/orders"
                className="text-xs text-slate-500 hover:text-navy-900 flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Orders
              </Link>
              <span className="text-[10px] font-mono-data font-bold text-growth-dark bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                PROVENANCE: IMMUTABLE
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono-data text-slate-400 uppercase font-bold tracking-wider">
                Transaction Identifier: {txId}
              </span>
              <h2 className="font-display font-bold text-xl text-navy-900 mt-1">
                Cryptographic Signature & Inventory Allocation Audit
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Verified with HMAC-SHA256 webhook digest. Recorded in append-only PostgreSQL table with immutability database triggers.
              </p>
            </div>

            {/* Cryptographic Inspector Box */}
            <div className="p-5 rounded-2xl bg-slate-950 text-slate-300 font-mono-data text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-emerald-400 font-bold uppercase text-[10px]">
                <span>Signature & Hash Integrity</span>
                <span>STATUS: VERIFIED</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div>
                  <span className="text-slate-500">Transaction ID: </span>
                  <span className="text-slate-200">{txId}</span>
                </div>
                <div>
                  <span className="text-slate-500">HMAC-SHA256 Signature: </span>
                  <span className="text-ai-glow">9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c</span>
                </div>
                <div>
                  <span className="text-slate-500">Inventory Allocation UUID: </span>
                  <span className="text-slate-200">inv_res_77a92b81-c304-4f11-9a28-ee0984920182</span>
                </div>
                <div>
                  <span className="text-slate-500">Policy Tier at Authorization: </span>
                  <span className="text-growth-emerald">TIER_2 (Student Limit ₹25,000 Verified)</span>
                </div>
                <div>
                  <span className="text-slate-500">Settled Amount (Integer Paise): </span>
                  <span className="text-slate-200">9,450,000 paise (₹94,500.00)</span>
                </div>
              </div>
            </div>

            {/* Immutability Verification Badge */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-growth-emerald flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-growth-dark block">
                  PostgreSQL Immutability Trigger Verified
                </span>
                <p className="text-slate-600 mt-0.5 text-[11px]">
                  Database trigger `trg_prevent_audit_log_mutation` strictly rejects UPDATE or DELETE queries on this ledger record.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
