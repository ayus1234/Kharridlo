import { NextRequest, NextResponse } from "next/server";
import { getOrCreateServerCart, evaluateSessionPolicy, recalculateCartTotals } from "@/lib/server-cart";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id") || request.headers.get("X-Session-ID") || "default_session";
  const cookieHeader = request.headers.get("cookie");

  let body: any = null;
  try {
    body = await request.json();
  } catch {}

  const cart = getOrCreateServerCart(sessionId, cookieHeader);
  if ((!cart.items || cart.items.length === 0) && body?.cart_items && Array.isArray(body.cart_items) && body.cart_items.length > 0) {
    for (const ci of body.cart_items) {
      const pid = ci.product_id || ci.id;
      const qty = ci.quantity || 1;
      const pricePaise = ci.unit_price_paise || (ci.unit_price_inr ? Math.round(ci.unit_price_inr * 100) : 49900);
      cart.items.push({
        id: ci.id || `ci_${pid}_${qty}`,
        cart_id: cart.id,
        product_id: pid,
        sku: ci.sku || pid,
        name: ci.name || ci.title || "Curated Product",
        brand: ci.brand || "Verified",
        category: ci.category || "gear",
        image_url: ci.image_url,
        provider: ci.provider || "kharridlo_verified",
        quantity: qty,
        unit_price_paise: pricePaise,
        line_total_paise: pricePaise * qty,
        availability_status: "in_stock",
      });
    }
    recalculateCartTotals(cart);
  }

  if (cart.items.length === 0) {
    return NextResponse.json(
      { detail: { message: "Cannot checkout with an empty cart." } },
      { status: 400 }
    );
  }

  const policy = evaluateSessionPolicy(sessionId, cookieHeader, body?.cart_items, body?.tier);
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
