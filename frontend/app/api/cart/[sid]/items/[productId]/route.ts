import { NextRequest, NextResponse } from "next/server";
import { updateServerCartQuantity, removeItemFromServerCart, serializeCartCookie } from "@/lib/server-cart";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { sid: string; productId: string } }
) {
  const { sid, productId } = params;
  try {
    const body = await request.json();
    const quantity = parseInt(body.quantity || "1", 10);
    const cookieHeader = request.headers.get("cookie");
    const updatedCart = updateServerCartQuantity(sid, productId, quantity, cookieHeader);
    const response = NextResponse.json(updatedCart);
    response.cookies.set("kharridlo_cart", serializeCartCookie(updatedCart.items), { path: "/", maxAge: 86400 });
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update quantity" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { sid: string; productId: string } }
) {
  return PATCH(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sid: string; productId: string } }
) {
  const { sid, productId } = params;
  const cookieHeader = request.headers.get("cookie");
  const updatedCart = removeItemFromServerCart(sid, productId, cookieHeader);
  const response = NextResponse.json(updatedCart);
  response.cookies.set("kharridlo_cart", serializeCartCookie(updatedCart.items), { path: "/", maxAge: 86400 });
  return response;
}
