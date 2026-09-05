import { NextRequest, NextResponse } from "next/server";
import { getOrCreateServerCart, evaluateSessionPolicy } from "@/lib/server-cart";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id") || request.headers.get("X-Session-ID") || "default_session";
  const cookieHeader = request.headers.get("cookie");

  const cart = getOrCreateServerCart(sessionId, cookieHeader);
  if (cart.items.length === 0) {
    return NextResponse.json(
      { detail: { message: "Cannot checkout with an empty cart." } },
      { status: 400 }
    );
  }

  const policy = evaluateSessionPolicy(sessionId, cookieHeader);
  if (policy.decision === "BLOCK") {
    return NextResponse.json(
      { detail: { message: policy.reasons[0]?.message || "Policy check blocked transaction." } },
      { status: 403 }
    );
  }

  const checkoutId = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  return NextResponse.json({
    id: checkoutId,
    session_id: sessionId,
    status: "authorized",
    buyer_confirmed: true,
    created_at: new Date().toISOString(),
    items_count: cart.total_items_count,
    total_paise: cart.total_paise,
    total_inr: Math.round(cart.total_paise / 100),
  });
}
