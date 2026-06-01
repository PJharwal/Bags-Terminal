import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Official Bags logo, inlined as a base64 data URI (read once at module load)
// so Satori can render it without a network fetch.
const officialLogoSrc = (() => {
  try {
    const buf = readFileSync(join(process.cwd(), "public", "bags-logo-official.png"));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
})();

// Fallback inline mark (used for the non-referral / site-wide card).
function BagsMark({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path
        d="M12 28C12 20 20 16 32 16C44 16 52 20 52 28L52 48C52 54 44 58 32 58C20 58 12 54 12 48L12 28Z"
        fill="#39FF14"
      />
      <path
        d="M22 16C22 16 24 12 32 12C40 12 42 16 42 16"
        stroke="#39FF14"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="32" cy="9" rx="5" ry="4" fill="#39FF14" />
    </svg>
  );
}

interface TokenOg {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  liquidity: number;
  imageDataUri: string | null;
}

function fmtUsd(n: number): string {
  if (!n) return "$0";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

async function fetchImageDataUri(url?: string): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "image/png";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

async function fetchTokenForOg(mint: string): Promise<TokenOg | null> {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${mint}`,
      { signal: AbortSignal.timeout(3500) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const pairs = (data?.pairs || []).filter(
      (p: { chainId?: string }) => p.chainId === "solana"
    );
    if (pairs.length === 0) return null;
    const p = pairs.sort(
      (a: { liquidity?: { usd?: number } }, b: { liquidity?: { usd?: number } }) =>
        (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    )[0];
    return {
      symbol: p.baseToken?.symbol || "?",
      name: p.baseToken?.name || "",
      price: parseFloat(p.priceUsd) || 0,
      change24h: p.priceChange?.h24 || 0,
      marketCap: p.marketCap || p.fdv || 0,
      volume24h: p.volume?.h24 || 0,
      liquidity: p.liquidity?.usd || 0,
      imageDataUri: await fetchImageDataUri(p.info?.imageUrl),
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const mint = req.nextUrl.searchParams.get("mint");
  const ref = req.nextUrl.searchParams.get("ref");
  const shortRef =
    ref && ref.length > 10 ? `${ref.slice(0, 4)}…${ref.slice(-4)}` : ref;

  // ── Per-token card (shared from /terminal/[mint]) ──────────────────
  if (mint) {
    const t = await fetchTokenForOg(mint);
    if (t) {
      const up = t.change24h >= 0;
      const changeColor = up ? "#39FF14" : "#FF003C";
      const priceStr =
        t.price < 0.01 ? `$${t.price.toFixed(8)}` : `$${t.price.toFixed(4)}`;
      return new ImageResponse(
        (
          <div
            style={{
              width: "1200px",
              height: "630px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              backgroundColor: "#050505",
              backgroundImage:
                "radial-gradient(circle at 20% 10%, rgba(57,255,20,0.14) 0%, transparent 45%), radial-gradient(circle at 85% 95%, rgba(0,240,255,0.10) 0%, transparent 50%)",
              padding: "64px",
              fontFamily: "monospace",
            }}
          >
            {/* Header: brand */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {officialLogoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={officialLogoSrc} width={56} height={56} alt="" />
              ) : (
                <BagsMark size={56} />
              )}
              <span style={{ fontSize: "30px", fontWeight: 700, color: "#EDEDED" }}>
                BAGS_TERMINAL
              </span>
              <span style={{ fontSize: "20px", color: "#666", marginLeft: "auto" }}>
                bagsterminal.fm
              </span>
            </div>

            {/* Token identity + price */}
            <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
              {t.imageDataUri ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.imageDataUri}
                  width={120}
                  height={120}
                  alt=""
                  style={{ border: "2px solid rgba(255,255,255,0.12)" }}
                />
              ) : (
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "2px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <span style={{ fontSize: "56px", fontWeight: 700, color: "#fff" }}>
                    {t.symbol.charAt(0)}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "64px", fontWeight: 700, color: "#fff", lineHeight: 1.05 }}>
                  ${t.symbol}
                </span>
                {t.name ? (
                  <span style={{ fontSize: "24px", color: "#888", marginTop: "2px" }}>
                    {t.name}
                  </span>
                ) : null}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginLeft: "auto" }}>
                <span style={{ fontSize: "52px", fontWeight: 700, color: "#fff" }}>
                  {priceStr}
                </span>
                <span style={{ fontSize: "30px", fontWeight: 700, color: changeColor, marginTop: "4px" }}>
                  {up ? "+" : ""}
                  {t.change24h.toFixed(1)}% 24h
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: "16px" }}>
              {[
                { label: "MARKET CAP", value: fmtUsd(t.marketCap) },
                { label: "VOLUME 24H", value: fmtUsd(t.volume24h) },
                { label: "LIQUIDITY", value: fmtUsd(t.liquidity) },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    padding: "20px 24px",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <span style={{ fontSize: "18px", color: "#666", letterSpacing: "2px" }}>
                    {s.label}
                  </span>
                  <span style={{ fontSize: "40px", fontWeight: 700, color: "#fff", marginTop: "6px" }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }
    // fall through to default card if token data unavailable
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#050505",
          backgroundImage:
            "radial-gradient(circle at 25% 15%, rgba(57,255,20,0.16) 0%, transparent 45%), radial-gradient(circle at 80% 90%, rgba(0,240,255,0.12) 0%, transparent 50%)",
          padding: "72px",
          fontFamily: "monospace",
        }}
      >
        {/* Top row: logo + wordmark. Always use the official logo. */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          {officialLogoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={officialLogoSrc} width={96} height={96} alt="" />
          ) : (
            <BagsMark size={96} />
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "52px",
                fontWeight: 700,
                color: "#EDEDED",
                letterSpacing: "-1px",
              }}
            >
              BAGS_TERMINAL
            </span>
            <span style={{ fontSize: "22px", color: "#888", marginTop: "4px" }}>
              bagsterminal.fm
            </span>
          </div>
        </div>

        {/* Middle: headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <span
            style={{
              fontSize: "76px",
              fontWeight: 700,
              color: "#FFFFFF",
              lineHeight: 1.05,
            }}
          >
            One Terminal.
          </span>
          <span
            style={{
              fontSize: "76px",
              fontWeight: 700,
              color: "#39FF14",
              lineHeight: 1.05,
            }}
          >
            Every Market.
          </span>
          <span
            style={{
              fontSize: "26px",
              color: "#9aa0a6",
              marginTop: "8px",
              maxWidth: "900px",
            }}
          >
            Spot memes, prediction markets & perps on Solana — built on bags.fm.
          </span>
        </div>

        {/* Bottom: referral badge or default tag */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {shortRef ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                border: "1px solid rgba(57,255,20,0.35)",
                backgroundColor: "rgba(57,255,20,0.08)",
                padding: "16px 28px",
              }}
            >
              <span style={{ fontSize: "22px", color: "#888" }}>REFERRED BY</span>
              <span
                style={{ fontSize: "26px", color: "#39FF14", fontWeight: 700 }}
              >
                {shortRef}
              </span>
              <span style={{ fontSize: "22px", color: "#888" }}>
                · launch with built-in fee sharing
              </span>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                border: "1px solid rgba(255,255,255,0.12)",
                padding: "16px 28px",
              }}
            >
              <span style={{ fontSize: "22px", color: "#9aa0a6" }}>
                LIVE · SOLANA MAINNET
              </span>
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
