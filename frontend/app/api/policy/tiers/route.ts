import { NextResponse } from "next/server";
import { getPolicyTiersData } from "@/lib/server-cart";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getPolicyTiersData());
}
