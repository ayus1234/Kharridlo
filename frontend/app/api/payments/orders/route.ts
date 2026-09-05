import { NextRequest, NextResponse } from "next/server";
import { getOrCreateServerCart } from "@/lib/server-cart";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id") || request.headers.get("X-Session-ID") || "default_session";
  const cart = getOrCreateServerCart(sessionId);

  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_1DP5mmOlF5G5ag";
  const internalOrderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const razorpayOrderId = `order_${Math.random().toString(36).substring(2, 16)}`;

  return NextResponse.json({
    internal_order_id: internalOrderId,
    razorpay_order_id: razorpayOrderId,
    amount_paise: cart.total_paise || 49900,
    amount_inr: Math.round((cart.total_paise || 49900) / 100),
    currency: "INR",
    receipt: `rcpt_${Date.now()}`,
    status: "created",
    key_id: razorpayKey,
  });
}
