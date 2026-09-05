import { NextRequest, NextResponse } from "next/server";
import { evaluateSessionPolicy } from "@/lib/server-cart";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { sid: string } }
) {
  const sid = params.sid;
  const cookieHeader = request.headers.get("cookie");
  let body: any = null;
  try {
    body = await request.json();
  } catch {}
  const result = evaluateSessionPolicy(sid, cookieHeader, body?.cart_items, body?.tier);
  return NextResponse.json(result);
}
