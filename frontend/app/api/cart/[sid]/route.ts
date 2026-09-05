import { NextRequest, NextResponse } from "next/server";
import { getOrCreateServerCart, clearServerCart } from "@/lib/server-cart";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { sid: string } }
) {
  const sid = params.sid;
  const cart = getOrCreateServerCart(sid);
  return NextResponse.json(cart);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sid: string } }
) {
  const sid = params.sid;
  const cart = clearServerCart(sid);
  return NextResponse.json(cart);
}
