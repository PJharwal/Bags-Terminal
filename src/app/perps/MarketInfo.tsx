"use client";

import { fmtPx, type PerpMarketEx } from "./lib";
import { formatCurrency, formatNumber } from "@/lib/format";

function Row({ l, v, c }: { l: string; v: string; c?: string }) {
  return (
    <div className="flex justify-between gap-3 py-[3px] border-b border-white/[0.03]">
      <span className="text-[#666] whitespace-nowrap">{l}</span>
      <span className="text-right tabular-nums truncate" style={{ color: c || "#ddd" }}>
        {v}
      </span>
    </div>
  );
}

export function MarketInfo({ m, oiCapped }: { m: PerpMarketEx; oiCapped: boolean }) {
  const premiumPct = m.premium * 100;
  const f1h = m.funding * 100;
  const lotSize = Math.pow(10, -m.szDecimals);

  return (
    <div className="font-mono text-[10px]">
      {oiCapped && (
        <div className="mb-2 px-2 py-1.5 rounded border border-[#FFB020]/40 bg-[#FFB020]/10 text-[#FFB020] text-[9px] font-bold tracking-widest text-center">
          AT OPEN INTEREST CAP — NEW POSITIONS RESTRICTED
        </div>
      )}

      <div className="text-[8px] text-[#555] tracking-widest mb-1">PRICE</div>
      <Row l="Mark" v={`$${fmtPx(m.markPx)}`} />
      <Row l="Oracle" v={`$${fmtPx(m.oraclePx)}`} />
      <Row l="Mid" v={m.midPx > 0 ? `$${fmtPx(m.midPx)}` : "—"} />
      <Row
        l="Premium (mark vs oracle)"
        v={`${premiumPct >= 0 ? "+" : ""}${premiumPct.toFixed(4)}%`}
        c={premiumPct >= 0 ? "#39FF14" : "#FF003C"}
      />
      <Row l="Impact bid / ask" v={m.impactBid > 0 ? `$${fmtPx(m.impactBid)} / $${fmtPx(m.impactAsk)}` : "—"} />

      <div className="text-[8px] text-[#555] tracking-widest mt-3 mb-1">FUNDING (CURRENT)</div>
      <Row l="1h rate" v={`${f1h >= 0 ? "+" : ""}${f1h.toFixed(4)}%`} c={f1h >= 0 ? "#39FF14" : "#FF003C"} />
      <Row l="8h equivalent" v={`${f1h >= 0 ? "+" : ""}${(f1h * 8).toFixed(4)}%`} c={f1h >= 0 ? "#39FF14" : "#FF003C"} />
      <Row
        l="Annualized (APR)"
        v={`${m.fundingAprPct >= 0 ? "+" : ""}${m.fundingAprPct.toFixed(2)}%`}
        c={m.fundingAprPct >= 0 ? "#39FF14" : "#FF003C"}
      />

      <div className="text-[8px] text-[#555] tracking-widest mt-3 mb-1">ACTIVITY</div>
      <Row l="Open interest" v={`${formatCurrency(m.openInterestUsd)} · ${formatNumber(m.openInterestBase)} ${m.coin}`} />
      <Row l="24h volume" v={`${formatCurrency(m.dayVolumeUsd)} · ${formatNumber(m.dayBaseVlm)} ${m.coin}`} />

      <div className="text-[8px] text-[#555] tracking-widest mt-3 mb-1">CONTRACT</div>
      <Row l="Max leverage" v={`${m.maxLeverage}×`} c="#FFD700" />
      <Row l="Lot size (min step)" v={`${lotSize} ${m.coin}`} />
      <Row l="Size decimals" v={String(m.szDecimals)} />

      <div className="text-[8px] text-[#555] tracking-widest mt-3 mb-1">MARGIN TIERS</div>
      <div className="grid grid-cols-2 text-[9px] tracking-widest text-[#555] pb-1 border-b border-white/5">
        <span>POSITION NOTIONAL</span>
        <span className="text-right">MAX LEV</span>
      </div>
      {m.marginTiers.map((t, i) => (
        <div key={i} className="grid grid-cols-2 py-[3px] border-b border-white/[0.03] tabular-nums">
          <span className="text-[#888]">≥ {formatCurrency(t.lowerBound)}</span>
          <span className="text-right text-[#FFD700]">{t.maxLeverage}×</span>
        </div>
      ))}
    </div>
  );
}
