"use client";

import Link from "next/link";
import { ArrowLeft, ShieldAlert, AlertOctagon, CheckCircle2, Clock, Terminal } from "lucide-react";
import MerchantSidebar from "@/components/MerchantSidebar";
import MerchantHeader from "@/components/MerchantHeader";

export default function PolicyProtectionAlertPage() {
  const alerts = [
    {
      id: "alt_01",
      timestamp: "10 mins ago",
      severity: "HIGH",
      rule: "TIER_1_DAILY_LIMIT_EXCEEDED",
      session: "sess_e109ff_1725454",
      amountInr: 16500,
      limitInr: 10000,
      description: "Buyer on unverified Tier 1 attempted to checkout cart of ₹16,500. Intercepted before Razorpay order generation.",
    },
    {
      id: "alt_02",
      timestamp: "32 mins ago",
      severity: "MEDIUM",
      rule: "RESTRICTED_CATEGORY_PROHIBITED",
      session: "sess_88b120_1725451",
      amountInr: 42000,
      limitInr: 25000,
      description: "Agent proposed commercial server rack equipment not eligible under student education catalog.",
    },
    {
      id: "alt_03",
      timestamp: "1 hour ago",
      severity: "LOW",
      rule: "STUDENT_AUTH_TOKEN_MISSING",
      session: "sess_39a110_1725450",
      amountInr: 8990,
      limitInr: 10000,
      description: "Checkout triggered without signed buyer authorization token. Gate blocked order creation.",
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <MerchantSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MerchantHeader
          title="Policy Protection Alerts"
          subtitle="Real-time security and velocity interception event feed"
          breadcrumbs={[
            { label: "Merchant", href: "/merchant" },
            { label: "Policy Center", href: "/merchant/policies" },
            { label: "Alerts" },
          ]}
          isSimulated={true}
        />

        <main className="flex-1 p-6 space-y-6 max-w-4xl w-full mx-auto">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <Link
                href="/merchant/policies"
                className="text-xs text-slate-500 hover:text-navy-900 flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Policy Center
              </Link>
              <span className="text-xs font-mono-data text-rose-600 font-bold bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                3 Interceptions Today
              </span>
            </div>

            {/* Alert Cards (policy_protection_alert) */}
            <div className="space-y-3">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 space-y-2 font-mono-data text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertOctagon className="h-4 w-4 text-rose-600" />
                      <span className="font-bold text-rose-700">{a.rule}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{a.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-700 font-sans leading-relaxed">
                    {a.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-rose-200/60 text-[11px] text-slate-600">
                    <span>Session: {a.session}</span>
                    <span>
                      Observed: <strong className="text-navy-900">₹{a.amountInr.toLocaleString("en-IN")}</strong> (Cap: ₹{a.limitInr.toLocaleString("en-IN")})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
