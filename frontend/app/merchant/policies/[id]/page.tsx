"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, CheckCircle2, Lock, FileText, AlertTriangle } from "lucide-react";
import MerchantSidebar from "@/components/MerchantSidebar";
import MerchantHeader from "@/components/MerchantHeader";

export default function PolicyProtectionDetailPage() {
  const params = useParams();
  const ruleId = params?.id as string || "rule_t1_base";

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <MerchantSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MerchantHeader
          title="Policy Protection Detail"
          subtitle={`Forensic rule evaluation parameters for rule ID ${ruleId}`}
          breadcrumbs={[
            { label: "Merchant", href: "/merchant" },
            { label: "Policy Center", href: "/merchant/policies" },
            { label: "Detail" },
          ]}
          isSimulated={true}
        />

        <main className="flex-1 p-6 space-y-6 max-w-4xl w-full mx-auto">
          {/* Detail Card (policy_protection_detail) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <Link
                href="/merchant/policies"
                className="text-xs text-slate-500 hover:text-navy-900 flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Policy Center
              </Link>
              <span className="text-[10px] font-mono-data font-bold text-growth-dark bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                RULE STATUS: ACTIVE
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono-data text-slate-400 uppercase font-bold tracking-wider">
                Rule Identifier: {ruleId}
              </span>
              <h2 className="font-display font-bold text-xl text-navy-900 mt-1">
                Student Tier Spending Cap & Merchant Restriction Engine
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enforces non-negotiable ceiling on unverified or student accounts. Evaluated before server-side payment order generation.
              </p>
            </div>

            {/* Forensic Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono-data text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase block">Single Tx Cap</span>
                <span className="text-navy-900 font-bold text-base mt-1 block">₹10,000</span>
                <span className="text-slate-500 text-[11px]">1,000,000 paise threshold</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase block">Daily Cap</span>
                <span className="text-navy-900 font-bold text-base mt-1 block">₹10,000</span>
                <span className="text-slate-500 text-[11px]">Rolling 24-hour window</span>
              </div>
            </div>

            {/* Cryptographic Proof Strip */}
            <div className="p-4 rounded-xl bg-slate-900 text-slate-300 font-mono-data text-xs space-y-2">
              <div className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                Deterministic Engine Signature
              </div>
              <div className="text-[11px]">Engine: Python Pydantic v2 + SQLAlchemy 2.0</div>
              <div className="text-[11px]">Evaluation Mode: Synchronous Pre-Order Gate</div>
              <div className="text-[11px]">Zero AI Override: Hardcoded Exception Barrier Active</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
