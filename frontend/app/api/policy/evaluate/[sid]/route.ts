import { NextRequest, NextResponse } from "next/server";
import { evaluateSessionPolicy } from "@/lib/server-cart";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { sid: string } }
) {
  const sid = params.sid;
  const result = evaluateSessionPolicy(sid);
  return NextResponse.json(result);
}
