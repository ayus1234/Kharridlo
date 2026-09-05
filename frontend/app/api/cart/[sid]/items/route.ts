import { NextRequest, NextResponse } from "next/server";
import { addItemToServerCart } from "@/lib/server-cart";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { sid: string } }
) {
  const sid = params.sid;
  try {
    const body = await request.json();
    const productId = body.product_id;
    const quantity = parseInt(body.quantity || "1", 10);

    if (!productId) {
      return NextResponse.json({ error: "product_id is required" }, { status: 400 });
    }

    const updatedCart = addItemToServerCart(sid, productId, quantity);
    return NextResponse.json(updatedCart);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to add item" }, { status: 500 });
  }
}
