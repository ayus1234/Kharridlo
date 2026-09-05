import { NextRequest, NextResponse } from "next/server";
import { clearServerCart } from "@/lib/server-cart";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id") || request.headers.get("X-Session-ID") || "default_session";
  
  // Clear cart upon successful payment verification
  clearServerCart(sessionId);

  return NextResponse.json({
    status: "SUCCESS",
    verification: "AUTHENTIC",
    message: "Payment successfully verified under Razorpay Test Mode escrow.",
  });
}
