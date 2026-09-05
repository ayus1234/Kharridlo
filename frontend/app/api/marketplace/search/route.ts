import { NextRequest, NextResponse } from "next/server";
import { getFilteredCatalog } from "@/lib/curated-catalog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const provider = searchParams.get("provider") || "all";
  const category = searchParams.get("category") || "all";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = Math.min(parseInt(searchParams.get("page_size") || "50", 10), 50);

  const backendUrl = process.env.INTERNAL_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

  // If a valid non-localhost backend URL is configured, try proxying to live backend
  if (backendUrl && !backendUrl.includes("localhost") && !backendUrl.includes("127.0.0.1")) {
    try {
      const targetUrl = new URL("/api/v1/marketplace/search", backendUrl);
      searchParams.forEach((val, key) => targetUrl.searchParams.set(key, val));
      
      const res = await fetch(targetUrl.toString(), {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(3500),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend request failed, fall through to resilient curated catalog
    }
  }

  // Fallback: serve curated authentic marketplace catalog
  const catalog = getFilteredCatalog({
    category,
    provider,
    query: q,
    page,
    pageSize,
  });

  return NextResponse.json(catalog);
}
