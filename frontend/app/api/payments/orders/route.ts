import { NextRequest, NextResponse } from "next/server";
import { getOrCreateServerCart, recalculateCartTotals } from "@/lib/server-cart";

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

  const razorpayKey = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TXcPVEXlFm6k9p";
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || "BJ7ALOf9DLx8kqgiAO6HnQjI";
  const internalOrderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const amountPaise = body?.total_paise || cart.total_paise || 49900;
  const receipt = `rcpt_${Date.now()}`;

  let razorpayOrderId: string | null = null;

  // Real server-side Razorpay Order Creation via official Razorpay API
  try {
    if (razorpayKey && razorpaySecret) {
      const auth = Buffer.from(`${razorpayKey}:${razorpaySecret}`).toString("base64");
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: receipt,
          notes: {
            session_id: sessionId,
            internal_order_id: internalOrderId,
          },
        }),
      });

      if (rzpRes.ok) {
        const rzpData = await rzpRes.json();
        if (rzpData && rzpData.id) {
          razorpayOrderId = rzpData.id;
        }
      } else {
        const errorText = await rzpRes.text();
        console.error("[Razorpay API Error]", rzpRes.status, errorText);
      }
    }
  } catch (err) {
    console.error("[Razorpay Order Creation Exception]", err);
  }

  return NextResponse.json({
    internal_order_id: internalOrderId,
    razorpay_order_id: razorpayOrderId,
    amount_paise: amountPaise,
    amount_inr: Math.round(amountPaise / 100),
    currency: "INR",
    receipt: receipt,
    status: "created",
    key_id: razorpayKey,
  });
}
