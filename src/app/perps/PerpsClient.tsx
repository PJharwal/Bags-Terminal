"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, ArrowUpDown, Lock, Star, ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import {
  CATEGORY_LIST,
  COIN_CATEGORY,
  fetchOiCapCoins,
  fetchPerpMarketsEx,
  fmtPx,
  type MarketCategory,
  type PerpMarketEx,
} from "./lib";
import { subscribeHl, useWsStatus, type WsActiveAssetCtx, type WsAllMids } from "./ws";
import { PerpsChart } from "./PerpsChart";
import { OrderBook } from "./OrderBook";
import { TradesFeed } from "./TradesFeed";
import { MarketInfo } from "./MarketInfo";
import { FundingPanel } from "./FundingPanel";
import { TradePanel } from "./TradePanel";
import { fetchCandles } from "@/services/hyperliquid.service";

const POLL_MS = 5000;
const FAVS_KEY = "bags-perp-favs";

type SortKey = "dayVolumeUsd" | "change24hPct" | "fundingAprPct" | "openInterestUsd" | "markPx";
type SideTab = "book" | "trades" | "info" | "funding";
type MobileTab = "chart" | "book" | "trade" | "markets";
type CatFilter = "ALL" | "FAVS" | MarketCategory;

const SIDE_TABS: Array<{ id: SideTab; label: string }> = [
  { id: "book", label: "Book" },
  { id: "trades", label: "Trades" },
  { id: "info", label: "Info" },
  { id: "funding", label: "Funding" },
];

const MOBILE_TABS: Array<{ id: MobileTab; label: string }> = [
  { id: "chart", label: "Chart" },
  { id: "book", label: "Book" },
  { id: "trade", label: "Trade" },
  { id: "markets", label: "Markets" },
];

function ChangeCell({ pct }: { pct: number }) {
  const pos = pct >= 0;
  return (
    <span className={`tabular-nums ${pos ? "text-[#39FF14]" : "text-[#FF003C]"}`}>
      {pos ? "+" : ""}
      {pct.toFixed(2)}%
    </span>
  );
}

export default function PerpsClient() {
  const [markets, setMarkets] = useState<PerpMarketEx[]>([]);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<string>("BTC");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("dayVolumeUsd");
  const [sortDesc, setSortDesc] = useState(true);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [cat, setCat] = useState<CatFilter>("ALL");
  const [sideTab, setSideTab] = useState<SideTab>("book");
  const [mobileTab, setMobileTab] = useState<MobileTab>("chart");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [dayRange, setDayRange] = useState<{ hi: number; lo: number } | null>(null);
  const [fundingIn, setFundingIn] = useState("");
  const [oiCaps, setOiCaps] = useState<Set<string>>(new Set());
  const aliveRef = useRef(true);
  const pickerRef = useRef<HTMLDivElement>(null);
  const validatedRef = useRef(false);
  const titleTsRef = useRef(0);
  const wsStatus = useWsStatus();
  const wsLive = wsStatus === "live";

  /* ----------------------- Deep link (?market=COIN) ---------------------- */
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search).get("market");
      if (p) setSelected(p.toUpperCase());
    } catch {}
  }, []);

  const selectMarket = useCallback((coin: string) => {
    setSelected(coin);
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("market", coin);
      window.history.replaceState(null, "", u.toString());
    } catch {}
  }, []);

  // Fall back to BTC if a deep-linked market doesn't exist.
  useEffect(() => {
    if (validatedRef.current || markets.length === 0) return;
    validatedRef.current = true;
    if (!markets.some((m) => m.coin === selected)) setSelected("BTC");
  }, [markets, selected]);

  /* --------------------------- Markets polling --------------------------- */
  const load = useCallback(() => {
    fetchPerpMarketsEx()
      .then((m) => {
        if (!aliveRef.current) return;
        setMarkets(m);
        setError(false);
      })
      .catch(() => aliveRef.current && setError(true));
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    load();
    const t = setInterval(load, POLL_MS);
    return () => {
      aliveRef.current = false;
      clearInterval(t);
    };
  }, [load]);

  /* ------------- WS: allMids price ticks for the markets table ------------ */
  const midsRef = useRef<Record<string, string> | null>(null);
  useEffect(() => {
    const unsub = subscribeHl({ type: "allMids" }, (raw) => {
      midsRef.current = (raw as WsAllMids).mids;
    });
    const t = setInterval(() => {
      const mids = midsRef.current;
      if (!mids) return;
      midsRef.current = null;
      setMarkets((prev) =>
        prev.length === 0
          ? prev
          : prev.map((m) => {
              const px = parseFloat(mids[m.coin] || "");
              if (!px || px === m.markPx) return m;
              return {
                ...m,
                markPx: px,
                change24hPct: m.prevDayPx > 0 ? ((px - m.prevDayPx) / m.prevDayPx) * 100 : 0,
                openInterestUsd: m.openInterestBase * px,
              };
            }),
      );
    }, 1000);
    return () => {
      unsub();
      clearInterval(t);
    };
  }, []);

  /* --------- WS: live full ctx (mark/oracle/funding/OI) for selected ------ */
  useEffect(() => {
    const unsub = subscribeHl({ type: "activeAssetCtx", coin: selected }, (raw) => {
      const { ctx } = raw as WsActiveAssetCtx;
      setMarkets((prev) =>
        prev.map((m) => {
          if (m.coin !== selected) return m;
          const markPx = parseFloat(ctx.markPx) || m.markPx;
          const funding = parseFloat(ctx.funding) || 0;
          const oiBase = parseFloat(ctx.openInterest) || m.openInterestBase;
          const prevDayPx = parseFloat(ctx.prevDayPx) || m.prevDayPx;
          return {
            ...m,
            markPx,
            oraclePx: parseFloat(ctx.oraclePx) || m.oraclePx,
            midPx: parseFloat(ctx.midPx || "") || m.midPx,
            premium: parseFloat(ctx.premium || "") || 0,
            impactBid: ctx.impactPxs ? parseFloat(ctx.impactPxs[0]) || 0 : m.impactBid,
            impactAsk: ctx.impactPxs ? parseFloat(ctx.impactPxs[1]) || 0 : m.impactAsk,
            funding,
            fundingAprPct: funding * 24 * 365 * 100,
            openInterestBase: oiBase,
            openInterestUsd: oiBase * markPx,
            dayVolumeUsd: parseFloat(ctx.dayNtlVlm) || m.dayVolumeUsd,
            dayBaseVlm: parseFloat(ctx.dayBaseVlm) || m.dayBaseVlm,
            prevDayPx,
            change24hPct: prevDayPx > 0 ? ((markPx - prevDayPx) / prevDayPx) * 100 : 0,
          };
        }),
      );
    });
    return unsub;
  }, [selected]);

  /* ----------------------------- OI-cap coins ---------------------------- */
  useEffect(() => {
    let alive = true;
    fetchOiCapCoins()
      .then((s) => alive && setOiCaps(s))
      .catch(() => {}); // metadata nicety — degrade silently
    return () => {
      alive = false;
    };
  }, []);

  /* --------------------------- Favorites (localStorage) ------------------ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVS_KEY);
      if (raw) setFavs(new Set(JSON.parse(raw)));
    } catch {}
  }, []);
  const toggleFav = (coin: string) => {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(coin)) next.delete(coin);
      else next.add(coin);
      try {
        localStorage.setItem(FAVS_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  /* ------------------- 24h high/low for selected market ------------------ */
  useEffect(() => {
    let alive = true;
    setDayRange(null);
    fetchCandles(selected, "1h")
      .then((cs) => {
        if (!alive) return;
        const last24 = cs.slice(-24);
        if (last24.length === 0) return;
        setDayRange({
          hi: Math.max(...last24.map((c) => c.high)),
          lo: Math.min(...last24.map((c) => c.low)),
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [selected]);

  /* --------------- Funding countdown (settles hourly on HL) -------------- */
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const secs = 3600 - (now.getUTCMinutes() * 60 + now.getUTCSeconds());
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      setFundingIn(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  /* ------------- Close market picker on outside click / Escape ----------- */
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPickerOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Reset picker search whenever it closes; precompute the filtered list.
  useEffect(() => {
    if (!pickerOpen) setPickerQuery("");
  }, [pickerOpen]);
  const pickerList = useMemo(() => {
    const q = pickerQuery.trim().toUpperCase();
    const sorted = [...markets].sort((a, b) => b.dayVolumeUsd - a.dayVolumeUsd);
    return q ? sorted.filter((m) => m.coin.toUpperCase().includes(q)) : sorted;
  }, [markets, pickerQuery]);

  const sel = markets.find((m) => m.coin === selected) || null;
  const selCapped = oiCaps.has(selected);

  /* ----------------- Live price in the browser tab title ----------------- */
  useEffect(() => {
    if (!sel) return;
    const now = Date.now();
    if (now - titleTsRef.current < 2000) return;
    titleTsRef.current = now;
    document.title = `$${fmtPx(sel.markPx)} ${sel.coin}-PERP · BAGS`;
  }, [sel, sel?.markPx]);
  useEffect(
    () => () => {
      document.title = "Perps Terminal";
    },
    [],
  );

  /* ------------------------------ Filtering ------------------------------ */
  const visible = useMemo(() => {
    const q = query.trim().toUpperCase();
    let filtered = q ? markets.filter((m) => m.coin.toUpperCase().includes(q)) : markets;
    if (cat === "FAVS") filtered = filtered.filter((m) => favs.has(m.coin));
    else if (cat !== "ALL") filtered = filtered.filter((m) => COIN_CATEGORY[m.coin] === cat);
    const dir = sortDesc ? -1 : 1;
    return [...filtered].sort((a, b) => (a[sortKey] - b[sortKey]) * dir);
  }, [markets, query, sortKey, sortDesc, cat, favs]);

  const totals = useMemo(
    () => ({
      vol: markets.reduce((a, m) => a + m.dayVolumeUsd, 0),
      oi: markets.reduce((a, m) => a + m.openInterestUsd, 0),
    }),
    [markets],
  );

  const header = (label: string, key: SortKey) => (
    <button
      onClick={() => {
        if (sortKey === key) setSortDesc((d) => !d);
        else {
          setSortKey(key);
          setSortDesc(true);
        }
      }}
      className={`flex items-center gap-1 justify-end w-full hover:text-white transition-colors ${
        sortKey === key ? "text-[#FFD700]" : ""
      }`}
    >
      {label}
      <ArrowUpDown size={9} />
    </button>
  );

  const catChip = (c: CatFilter, label: string) => (
    <button
      key={c}
      onClick={() => setCat(c)}
      className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider whitespace-nowrap transition-colors flex items-center gap-1 ${
        cat === c ? "bg-[#FFD700] text-black" : "text-[#666] hover:text-white border border-white/8"
      }`}
    >
      {c === "FAVS" && <Star size={8} fill={cat === c ? "currentColor" : "none"} />}
      {label}
    </button>
  );

  return (
    <div className="min-h-[calc(100vh-92px)] bg-[#050505] text-[#EDEDED] p-3 sm:p-4 font-mono">
      <div className="max-w-[1500px] mx-auto">
        {/* ------------ Market header strip ------------ */}
        <div className="card px-4 py-3 mb-3 flex items-center gap-5 flex-wrap">
          {/* Market picker */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setPickerOpen((o) => !o)}
              className="flex items-center gap-2 text-base font-bold text-display text-white hover:text-[#FFD700] transition-colors"
            >
              {selected}-PERP
              <ChevronDown size={14} className="text-[#666]" />
            </button>
            {pickerOpen && (
              <div className="absolute z-30 top-full mt-2 left-0 w-72 card p-0 border border-white/10 shadow-2xl bg-[#0A0A0A] overflow-hidden">
                <div className="flex items-center gap-2 px-2.5 py-2 border-b border-white/5">
                  <Search size={11} className="text-[#555] shrink-0" />
                  <input
                    autoFocus
                    value={pickerQuery}
                    onChange={(e) => setPickerQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setPickerOpen(false);
                      if (e.key === "Enter" && pickerList[0]) {
                        selectMarket(pickerList[0].coin);
                        setPickerOpen(false);
                      }
                    }}
                    placeholder="Search all markets…"
                    className="bg-transparent text-[11px] font-mono text-white outline-none flex-1"
                  />
                  <span className="text-[9px] text-[#555] tabular-nums shrink-0">{pickerList.length}</span>
                </div>
                <div className="max-h-72 overflow-y-auto p-1">
                  {pickerList.length === 0 ? (
                    <div className="py-6 text-center text-[10px] text-[#555]">No markets match</div>
                  ) : (
                    pickerList.map((m) => (
                      <button
                        key={m.coin}
                        onClick={() => {
                          selectMarket(m.coin);
                          setPickerOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 text-[11px] hover:bg-white/5 rounded ${
                          m.coin === selected ? "bg-[#FFD700]/8" : ""
                        }`}
                      >
                        <span className="flex-1 min-w-0 truncate text-left font-bold text-white">{m.coin}</span>
                        <span className="text-right text-[#888] tabular-nums">{fmtPx(m.markPx)}</span>
                        <span className="w-16 text-right">
                          <ChangeCell pct={m.change24hPct} />
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {sel && (
            <>
              <div>
                <div className="text-xl font-bold text-white leading-none tabular-nums">${fmtPx(sel.markPx)}</div>
                <div className="text-[10px] mt-0.5">
                  <ChangeCell pct={sel.change24hPct} />
                </div>
              </div>
              {[
                { l: "ORACLE", v: `$${fmtPx(sel.oraclePx)}` },
                {
                  l: "PREMIUM",
                  v: `${sel.premium >= 0 ? "+" : ""}${(sel.premium * 100).toFixed(4)}%`,
                  c: sel.premium >= 0 ? "#39FF14" : "#FF003C",
                },
                { l: "24H HIGH", v: dayRange ? `$${fmtPx(dayRange.hi)}` : "…" },
                { l: "24H LOW", v: dayRange ? `$${fmtPx(dayRange.lo)}` : "…" },
                {
                  l: "FUNDING · NEXT IN",
                  v: `${(sel.funding * 100).toFixed(4)}% · ${fundingIn}`,
                  c: sel.funding >= 0 ? "#39FF14" : "#FF003C",
                  mobile: true,
                },
                { l: "OPEN INTEREST", v: formatCurrency(sel.openInterestUsd) },
                { l: "24H VOLUME", v: formatCurrency(sel.dayVolumeUsd) },
                { l: "MAX LEV", v: `${sel.maxLeverage}×` },
              ].map((s: { l: string; v: string; c?: string; mobile?: boolean }) => (
                <div key={s.l} className={s.mobile ? "block" : "hidden sm:block"}>
                  <div className="text-[8px] text-[#555] tracking-widest whitespace-nowrap">{s.l}</div>
                  <div
                    className="text-[11px] font-bold tabular-nums whitespace-nowrap"
                    style={{ color: s.c || "#ddd" }}
                  >
                    {s.v}
                  </div>
                </div>
              ))}
              {selCapped && (
                <span className="px-2 py-0.5 rounded border border-[#FFB020]/40 bg-[#FFB020]/10 text-[8px] font-bold tracking-widest text-[#FFB020]">
                  AT OI CAP
                </span>
              )}
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            {wsLive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#39FF14]/30 bg-[#39FF14]/8 text-[9px] font-bold tracking-[0.14em] text-[#39FF14]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse" />
                LIVE · HYPERLIQUID
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#FFB020]/30 bg-[#FFB020]/8 text-[9px] font-bold tracking-[0.14em] text-[#FFB020]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFB020]" />
                DELAYED · POLLING
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#FFB020]/30 bg-[#FFB020]/8 text-[9px] font-bold tracking-[0.14em] text-[#FFB020]">
              <Lock size={9} />
              EXECUTION COMING SOON
            </span>
          </div>
        </div>

        {error && markets.length === 0 ? (
          <div className="text-center py-20 text-[#FF003C] text-xs">
            Failed to reach Hyperliquid.{" "}
            <button onClick={load} className="underline hover:text-white">
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* ------------ Mobile segmented control ------------ */}
            <div className="flex xl:hidden mb-3 border border-white/8 rounded overflow-hidden">
              {MOBILE_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setMobileTab(t.id)}
                  className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-widest transition-colors ${
                    mobileTab === t.id ? "bg-[#FFD700] text-black" : "text-[#666] hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ------------ Chart · Book/Trades/Info/Funding · Trade panel ------------ */}
            <div className="grid grid-cols-1 xl:grid-cols-[1.9fr_0.75fr_0.75fr] gap-3 mb-3">
              <div className={`${mobileTab === "chart" ? "" : "hidden"} xl:block min-w-0`}>
                <PerpsChart coin={selected} />
              </div>

              <div className={`${mobileTab === "book" ? "" : "hidden"} xl:block min-w-0`}>
                <div className="card p-0 overflow-hidden">
                  <div className="flex border-b border-white/5">
                    {SIDE_TABS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSideTab(t.id)}
                        className={`flex-1 py-2 text-[9px] font-mono font-bold uppercase tracking-widest transition-colors ${
                          sideTab === t.id
                            ? "text-[#FFD700] border-b border-[#FFD700]"
                            : "text-[#555] hover:text-white"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-3 max-h-[420px] overflow-y-auto">
                    {sideTab === "book" && <OrderBook coin={selected} szDecimals={sel?.szDecimals ?? 3} />}
                    {sideTab === "trades" && <TradesFeed coin={selected} szDecimals={sel?.szDecimals ?? 3} />}
                    {sideTab === "info" &&
                      (sel ? (
                        <MarketInfo m={sel} oiCapped={selCapped} />
                      ) : (
                        <div className="text-[10px] font-mono text-[#555] py-6 text-center">Loading market…</div>
                      ))}
                    {sideTab === "funding" && <FundingPanel coin={selected} />}
                  </div>
                </div>
              </div>

              <div className={`${mobileTab === "trade" ? "" : "hidden"} xl:block min-w-0`}>
                {sel ? (
                  <TradePanel market={sel} />
                ) : (
                  <div className="card p-4 text-[10px] font-mono text-[#555] text-center py-10">
                    Loading market…
                  </div>
                )}
              </div>
            </div>

            {/* ------------ Markets table ------------ */}
            <div className={`${mobileTab === "markets" ? "" : "hidden"} xl:block`}>
              <div className="card p-0 overflow-hidden">
                <div className="flex items-center gap-3 px-3 py-2 border-b border-white/5 flex-wrap">
                  <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                    <Search size={12} className="text-[#555]" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search markets…"
                      className="bg-transparent text-[11px] font-mono text-white outline-none flex-1"
                    />
                  </div>
                  <span className="text-[9px] text-[#555] tracking-widest tabular-nums whitespace-nowrap">
                    {markets.length} MARKETS · 24H VOL {formatCurrency(totals.vol)} · OI {formatCurrency(totals.oi)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/5 overflow-x-auto">
                  {catChip("ALL", "ALL")}
                  {catChip("FAVS", "FAVS")}
                  {CATEGORY_LIST.map((c) => catChip(c, c))}
                </div>
                <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                <div className="grid grid-cols-[30px_88px_1fr_1fr_1fr_1fr_1fr] gap-2 px-3 py-2 text-[9px] uppercase tracking-widest text-[#555] border-b border-white/5">
                  <span />
                  <span>Market</span>
                  {header("Price", "markPx")}
                  {header("24h", "change24hPct")}
                  {header("Funding APR", "fundingAprPct")}
                  {header("OI", "openInterestUsd")}
                  {header("24h Vol", "dayVolumeUsd")}
                </div>
                <div className="max-h-[420px] overflow-y-auto">
                  {markets.length === 0 ? (
                    <div className="py-16 text-center text-[#555] text-[11px]">Loading markets…</div>
                  ) : visible.length === 0 ? (
                    <div className="py-10 text-center text-[#555] text-[11px]">
                      {cat === "FAVS" ? "No favorites yet — star a market." : "No matches."}
                    </div>
                  ) : (
                    visible.map((m) => (
                      <div
                        key={m.coin}
                        role="button"
                        tabIndex={0}
                        onClick={() => selectMarket(m.coin)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            selectMarket(m.coin);
                          }
                        }}
                        className={`grid grid-cols-[30px_88px_1fr_1fr_1fr_1fr_1fr] gap-2 px-3 py-2 text-[11px] border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors text-right cursor-pointer ${
                          selected === m.coin ? "bg-[#FFD700]/5" : ""
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFav(m.coin);
                          }}
                          aria-label={`Toggle favorite ${m.coin}`}
                          className={favs.has(m.coin) ? "text-[#FFD700]" : "text-[#333] hover:text-[#666]"}
                        >
                          <Star size={11} fill={favs.has(m.coin) ? "currentColor" : "none"} />
                        </button>
                        <span className="text-left font-bold text-white flex items-center gap-1.5 min-w-0">
                          <span className="truncate">{m.coin}</span>
                          <span className="text-[8px] text-[#555] font-normal tabular-nums">{m.maxLeverage}×</span>
                          {oiCaps.has(m.coin) && (
                            <span className="text-[7px] px-1 rounded border border-[#FFB020]/40 text-[#FFB020] font-bold">
                              CAP
                            </span>
                          )}
                        </span>
                        <span className="text-[#ddd] text-right tabular-nums">{fmtPx(m.markPx)}</span>
                        <span>
                          <ChangeCell pct={m.change24hPct} />
                        </span>
                        <span
                          className={`tabular-nums ${m.fundingAprPct >= 0 ? "text-[#39FF14]/80" : "text-[#FF003C]/80"}`}
                        >
                          {m.fundingAprPct.toFixed(1)}%
                        </span>
                        <span className="text-[#888] tabular-nums">{formatCurrency(m.openInterestUsd)}</span>
                        <span className="text-[#888] tabular-nums">{formatCurrency(m.dayVolumeUsd)}</span>
                      </div>
                    ))
                  )}
                </div>
                </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
