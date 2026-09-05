import { NextRequest, NextResponse } from "next/server";
import { setSessionPolicyTier } from "@/lib/server-cart";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { sid: string } }
) {
  const sid = params.sid;
  try {
    const body = await request.json();
    const tier = body.tier || "STANDARD";
    setSessionPolicyTier(sid, tier);
    return NextResponse.json({ success: true, tier });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
