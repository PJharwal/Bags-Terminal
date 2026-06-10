import { NextRequest, NextResponse } from "next/server";

// Server-side proxy to Hyperliquid's public info API. Read-only: only
// whitelisted info request types are forwarded — never exchange/signing calls.
const HL_INFO_URL = "https://api.hyperliquid.xyz/info";

const ALLOWED_TYPES = new Set([
  "meta",
  "metaAndAssetCtxs",
  "allMids",
  "l2Book",
  "candleSnapshot",
  "fundingHistory",
  "recentTrades",
  "perpsAtOpenInterestCap",
  "perpCategories",
  "predictedFundings",
]);

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body?.type !== "string" || !ALLOWED_TYPES.has(body.type)) {
    return NextResponse.json({ error: "Unsupported request type" }, { status: 400 });
  }

  try {
    const res = await fetch(HL_INFO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Hyperliquid ${res.status}` }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Hyperliquid unavailable" }, { status: 502 });
  }
}
