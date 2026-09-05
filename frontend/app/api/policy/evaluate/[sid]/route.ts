import { NextRequest, NextResponse } from "next/server";
import { evaluateSessionPolicy } from "@/lib/server-cart";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { sid: string } }
) {
  const sid = params.sid;
  const cookieHeader = request.headers.get("cookie");
  const result = evaluateSessionPolicy(sid, cookieHeader);
  return NextResponse.json(result);
}
