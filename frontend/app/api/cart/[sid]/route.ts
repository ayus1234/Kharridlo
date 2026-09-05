import { NextRequest, NextResponse } from "next/server";
import { getOrCreateServerCart, clearServerCart, serializeCartCookie } from "@/lib/server-cart";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { sid: string } }
) {
  const sid = params.sid;
  const cookieHeader = request.headers.get("cookie");
  const cart = getOrCreateServerCart(sid, cookieHeader);
  const response = NextResponse.json(cart);
  response.cookies.set("kharridlo_cart", serializeCartCookie(cart.items), { path: "/", maxAge: 86400 });
  return response;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sid: string } }
) {
  const sid = params.sid;
  const cart = clearServerCart(sid);
  const response = NextResponse.json(cart);
  response.cookies.set("kharridlo_cart", "", { path: "/", maxAge: 0 });
  return response;
}
