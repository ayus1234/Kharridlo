import { NextRequest, NextResponse } from "next/server";
import { getOrCreateServerCart, evaluateSessionPolicy } from "@/lib/server-cart";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id") || request.headers.get("X-Session-ID") || "default_session";

  const cart = getOrCreateServerCart(sessionId);
  if (cart.items.length === 0) {
    return NextResponse.json(
      { detail: { message: "Cannot checkout with an empty cart." } },
      { status: 400 }
    );
  }

  const policy = evaluateSessionPolicy(sessionId);
  if (policy.status !== "PASSED") {
    return NextResponse.json(
      { detail: { message: policy.reason } },
      { status: 403 }
    );
  }

  const checkoutId = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  return NextResponse.json({
    id: checkoutId,
    session_id: sessionId,
    status: "authorized",
    amount_paise: cart.total_paise,
    amount_inr: Math.round(cart.total_paise / 100),
    expires_at: new Date(Date.now() + 1800000).toISOString(),
  });
}
