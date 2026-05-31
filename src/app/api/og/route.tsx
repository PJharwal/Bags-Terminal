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

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");
  const shortRef =
    ref && ref.length > 10 ? `${ref.slice(0, 4)}…${ref.slice(-4)}` : ref;

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
        {/* Top row: logo + wordmark. Referral cards use the official logo. */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          {shortRef && officialLogoSrc ? (
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
