"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { AlertTriangle, Lock, ExternalLink, Share2, X } from "lucide-react";
import { PredictionPnLCard } from "@/components/share/PredictionPnLCard";
import { config } from "@/config/env";
import { useTurnkey } from "@/components/turnkey/TurnkeyProvider";
import { usePolymarketTrade } from "@/hooks/usePolymarketTrade";
import {
  fetchPolyPositions,
  type PolyEvent,
  type PolyMarket,
  type PolyPosition,
} from "@/services/polymarket.service";
import {
  STATUS_META,
  getMarketStatus,
  getOutcomeLabels,
  getOutcomePrices,
  getTokenIds,
  type EventStatus,
} from "@/lib/polymarket";

const SOL_PRESETS = [0.05, 0.1, 0.5, 1];
const QUOTE_DEBOUNCE_MS = 400;
// T-ncg-02: slippage clamped to a sane range before emit
const MIN_SLIPPAGE = 0.1;
const MAX_SLIPPAGE = 50;

function shortSig(sig: string): string {
  return sig.length > 14 ? `${sig.slice(0, 6)}…${sig.slice(-6)}` : sig;
}

const STEP_COLORS: Record<string, string> = {
  pending: "#444",
  in_progress: "#00F0FF",
  completed: "#39FF14",
  failed: "#FF003C",
};

interface TradingSidebarProps {
  market: PolyMarket;
  event?: PolyEvent;
}

export function TradingSidebar({ market, event }: TradingSidebarProps) {
  const { phantomAddress, balance } = useTurnkey();
  const {
    state,
    steps,
    error,
    result,
    quote,
    buy,
    sell,
    getQuote,
    reset,
  } = usePolymarketTrade();

  const isExecuting = state === "connecting" || state === "executing";

  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [selectedOutcome, setSelectedOutcome] = useState<"Yes" | "No" | null>(null);
  const [solAmount, setSolAmount] = useState("");
  const [sellShares, setSellShares] = useState("");
  const [slippage, setSlippage] = useState("5");

  // Tradability status — drives the click guardrails (closed disables the
  // panel, no-activity interposes an inline confirm, thin shows a warning).
  const marketStatus: EventStatus = useMemo(
    () => getMarketStatus(market, event),
    [market, event],
  );

  // No-activity inline confirm — shown when the user tries to buy a market
  // with zero recent trades. They can override and place anyway, but they're
  // warned first so a likely-failed FOK doesn't feel like a silent bug.
  const [showNoActivityConfirm, setShowNoActivityConfirm] = useState(false);

  // ── Positions ──────────────────────────────────────────────────
  const [positions, setPositions] = useState<PolyPosition[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  // Real position selected for the shareable PnL card (null = modal closed).
  const [sharePos, setSharePos] = useState<PolyPosition | null>(null);
  const prevResultRef = useRef(result);

  const fetchPositions = useCallback(async () => {
    if (!phantomAddress) return;
    setPositionsLoading(true);
    try {
      const data = await fetchPolyPositions(phantomAddress);
      if (Array.isArray(data.positions)) {
        setPositions(data.positions);
      }
    } catch (e) {
      console.error("Failed to fetch positions:", e);
    } finally {
      setPositionsLoading(false);
    }
  }, [phantomAddress]);

  // Fetch positions on mount and when switching to the sell tab
  useEffect(() => {
    if (phantomAddress) fetchPositions();
  }, [phantomAddress, fetchPositions]);

  useEffect(() => {
    if (tab === "sell") fetchPositions();
  }, [tab, fetchPositions]);

  // Fetch positions after a successful trade — delayed slightly to let the
  // Polymarket data-api index the new position.
  useEffect(() => {
    if (result?.success && !prevResultRef.current?.success) {
      const timer = setTimeout(fetchPositions, 3000);
      return () => clearTimeout(timer);
    }
    prevResultRef.current = result;
  }, [result, fetchPositions]);

  // ── Market field derivations ───────────────────────────────────
  const tokenIds = getTokenIds(market);
  const prices = getOutcomePrices(market);
  // Display labels — read from market.outcomes (e.g. ["Delhi Capitals",
  // "Gujarat Titans"] for sports, ["Yes", "No"] for binary markets).
  // selectedOutcome stays "Yes" | "No" internally because it represents the
  // INDEX (Yes = 0, No = 1) — the CLOB position API also tags positions with
  // these literal strings, so we keep them as the canonical internal name and
  // only translate to display labels at the UI boundary.
  const outcomeLabels = getOutcomeLabels(market);
  const labelFor = (side: "Yes" | "No" | null) =>
    side === "Yes" ? outcomeLabels[0] : side === "No" ? outcomeLabels[1] : "";

  const selectedTokenId =
    selectedOutcome === "Yes" ? tokenIds[0] : selectedOutcome === "No" ? tokenIds[1] : "";

  // Find current position for selected market + outcome.
  // Match by conditionId, or by asset (tokenId), or by market question.
  const matchPosition = useCallback(
    (p: PolyPosition, outcome: "Yes" | "No", tokenId: string): boolean => {
      if (Number(p.size ?? 0) <= 0) return false;
      const outcomeMatch = p.outcome?.toLowerCase() === outcome.toLowerCase();
      if (!outcomeMatch) return false;
      if (p.conditionId && market.conditionId && p.conditionId === market.conditionId) return true;
      if (p.asset && tokenId && p.asset === tokenId) return true;
      if (p.title && p.title === market.question) return true;
      return false;
    },
    [market],
  );

  const currentPosition = selectedOutcome
    ? positions.find((p) => matchPosition(p, selectedOutcome, selectedTokenId))
    : undefined;
  const positionShares = Number(currentPosition?.size ?? 0);

  // ── Quote (buy tab, debounced on amount change) ────────────────
  useEffect(() => {
    if (tab !== "buy" || !selectedOutcome) return;
    const amount = parseFloat(solAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const t = setTimeout(() => {
      getQuote(amount); // resolves null on timeout — UI simply renders nothing
    }, QUOTE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [solAmount, selectedOutcome, tab, getQuote]);

  const selectedPrice =
    selectedOutcome === "Yes" ? prices[0] : selectedOutcome === "No" ? prices[1] : 0;

  const usdcEstimate = quote?.usdc_display ?? 0;
  // Each share costs selectedPrice, pays $1 if the outcome wins
  const sharesEstimate =
    usdcEstimate && selectedPrice > 0 ? usdcEstimate / selectedPrice : 0;
  const payoutEstimate = sharesEstimate;
  const profitEstimate = payoutEstimate - usdcEstimate;
  const returnPct = usdcEstimate > 0 ? (profitEstimate / usdcEstimate) * 100 : 0;

  // ── Execution ──────────────────────────────────────────────────

  // Internal trade execution — bypasses status guards so the no-activity
  // inline confirm can call it directly after the user clicks "Place anyway".
  const performExecute = useCallback(() => {
    if (!phantomAddress || !selectedOutcome) return;

    const tokenId = selectedOutcome === "Yes" ? tokenIds[0] : tokenIds[1];
    const price = selectedOutcome === "Yes" ? prices[0] : prices[1];

    if (tab === "sell") {
      // T-ncg-02: parse + reject NaN/<=0 before emit
      const shares = parseFloat(sellShares);
      if (!Number.isFinite(shares) || shares <= 0) return;
      const rawSlippage = parseFloat(slippage);
      const slippagePct = Number.isFinite(rawSlippage)
        ? Math.min(MAX_SLIPPAGE, Math.max(MIN_SLIPPAGE, rawSlippage))
        : 5;

      sell({
        phantomAddress,
        tokenId,
        outcome: selectedOutcome,
        price,
        shares,
        slippagePct,
      });
    } else {
      const amount = parseFloat(solAmount);
      if (!Number.isFinite(amount) || amount <= 0) return;

      buy({
        phantomAddress,
        solAmount: amount,
        tokenId,
        outcome: selectedOutcome,
        price,
      });
    }
  }, [phantomAddress, selectedOutcome, tokenIds, prices, tab, sellShares, slippage, solAmount, buy, sell]);

  // Public handler — gates execution on market status:
  //   - closed → blocked entirely (button is also disabled)
  //   - no-activity → inline confirm step first (buys only)
  //   - thin / active → straight through
  const handleExecute = useCallback(() => {
    if (marketStatus === "closed") return;
    if (marketStatus === "no-activity" && tab === "buy" && !showNoActivityConfirm) {
      setShowNoActivityConfirm(true);
      return;
    }
    setShowNoActivityConfirm(false);
    performExecute();
  }, [marketStatus, tab, showNoActivityConfirm, performExecute]);

  const handleOutcomeSelect = (outcome: "Yes" | "No") => {
    setSelectedOutcome(outcome);
    setShowNoActivityConfirm(false);
    reset();
  };

  const amountInvalid =
    tab === "buy"
      ? !solAmount || !(parseFloat(solAmount) > 0)
      : !sellShares || !(parseFloat(sellShares) > 0);

  const executeDisabled =
    isExecuting || marketStatus === "closed" || amountInvalid || !phantomAddress;

  return (
    <div className="w-full lg:w-[340px] flex-shrink-0 lg:sticky lg:top-24 card p-4 space-y-4 self-start">
      {/* Market question */}
      <h3 className="text-[12px] font-bold text-white leading-snug">
        {market.question}
      </h3>

      {/* Closed banner — explains why the trade panel is disabled */}
      {marketStatus === "closed" && (
        <div className="flex items-start gap-2 border border-[#FF003C]/30 bg-[#FF003C]/8 p-3 text-[10px] text-[#FF003C]">
          <Lock size={13} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold uppercase tracking-wider">Market closed</p>
            <p className="mt-0.5 leading-relaxed opacity-80">
              {STATUS_META.closed.description}
            </p>
          </div>
        </div>
      )}

      {/* Buy/Sell toggle */}
      <div className="flex border border-white/8 rounded overflow-hidden">
        <button
          onClick={() => { setTab("buy"); reset(); setShowNoActivityConfirm(false); }}
          disabled={marketStatus === "closed"}
          className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            tab === "buy" ? "bg-[#39FF14] text-black" : "text-[#666] hover:text-white"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => { setTab("sell"); reset(); setShowNoActivityConfirm(false); }}
          disabled={marketStatus === "closed"}
          className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            tab === "sell" ? "bg-[#FF003C] text-white" : "text-[#666] hover:text-white"
          }`}
        >
          Sell
        </button>
      </div>

      {/* Outcome buttons — labels come from market.outcomes (Yes/No, team
          names, candidate names…). Internal value stays "Yes"/"No" because
          that's what the CLOB position API uses. */}
      <div className="flex gap-2">
        {(["Yes", "No"] as const).map((outcome, idx) => {
          const displayLabel = outcomeLabels[idx];
          const tId = tokenIds[idx];
          const pos = positions.find((p) => matchPosition(p, outcome, tId));
          const shares = Number(pos?.size ?? 0);
          const isYes = outcome === "Yes";
          const isSelected = selectedOutcome === outcome;
          return (
            <button
              key={outcome}
              onClick={() => handleOutcomeSelect(outcome)}
              disabled={marketStatus === "closed"}
              className={`flex-1 py-2.5 font-bold text-center transition-all relative border disabled:opacity-40 disabled:cursor-not-allowed ${
                isYes
                  ? isSelected
                    ? "bg-[#39FF14] text-black border-[#39FF14]"
                    : "border-[#39FF14]/30 bg-[#39FF14]/8 text-[#39FF14] hover:bg-[#39FF14]/15"
                  : isSelected
                    ? "bg-[#FF003C] text-white border-[#FF003C]"
                    : "border-[#FF003C]/30 bg-[#FF003C]/8 text-[#FF003C] hover:bg-[#FF003C]/15"
              }`}
            >
              <div className="text-[11px] truncate px-1">{displayLabel}</div>
              <div className="text-[10px] opacity-80 tabular-nums">
                {Math.round(prices[idx] * 100)}¢
              </div>
              {shares > 0 && (
                <div className="absolute -top-2 -right-2 bg-white text-black text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 tabular-nums">
                  {shares.toFixed(0)}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedOutcome && (
        <>
          {tab === "buy" ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="label">Amount</span>
                {balance != null && (
                  <span className="text-[9px] text-[#555] tabular-nums">
                    BAL {balance.toFixed(3)} SOL
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={solAmount}
                  onChange={(e) => setSolAmount(e.target.value)}
                  placeholder="0.00"
                  className="input w-full px-3 py-2.5 text-base font-bold tabular-nums pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#555] font-bold">
                  SOL
                </span>
              </div>
              <div className="flex gap-1.5 mt-2">
                {SOL_PRESETS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSolAmount(amount.toString())}
                    className="btn-ghost flex-1 py-1 text-[10px] font-bold tabular-nums"
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Positions list */}
              <div>
                <div className="label mb-1.5">Your positions</div>
                {positionsLoading && positions.length === 0 ? (
                  <div className="text-[10px] text-[#555] animate-pulse">
                    Loading positions…
                  </div>
                ) : positions.filter((p) => Number(p.size ?? 0) > 0).length === 0 ? (
                  <div className="text-[10px] text-[#555]">No open positions.</div>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {positions
                      .filter((p) => Number(p.size ?? 0) > 0)
                      .map((p, i) => (
                        <div
                          key={`${p.conditionId}-${p.outcome}-${i}`}
                          className="border border-white/5 bg-white/[0.02] p-2 text-[9px] space-y-0.5"
                        >
                          <div className="flex justify-between gap-2 items-center">
                            <span className="text-[#888] truncate">{p.title}</span>
                            <span className="text-white font-bold whitespace-nowrap">
                              {p.outcome}
                            </span>
                            <button
                              onClick={() => setSharePos(p)}
                              title="Share PnL card"
                              className="text-[#555] hover:text-[#00F0FF] transition-colors shrink-0"
                            >
                              <Share2 size={11} />
                            </button>
                          </div>
                          <div className="flex justify-between tabular-nums">
                            <span className="text-[#555]">
                              {Number(p.size ?? 0).toFixed(1)} sh @{" "}
                              {(Number(p.avgPrice ?? 0) * 100).toFixed(1)}¢
                            </span>
                            <span
                              className={`font-bold ${
                                Number(p.cashPnl ?? 0) >= 0
                                  ? "text-[#39FF14]"
                                  : "text-[#FF003C]"
                              }`}
                            >
                              {Number(p.cashPnl ?? 0) >= 0 ? "+" : ""}
                              ${Number(p.cashPnl ?? 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Matched position for the selected outcome */}
              {currentPosition && positionShares > 0 ? (
                <div className="border border-white/8 bg-white/[0.02] p-2.5 space-y-1 text-[10px] tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-[#555]">Your {labelFor(selectedOutcome)} shares</span>
                    <span className="text-white font-bold">{positionShares.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#555]">Avg entry</span>
                    <span className="text-[#ddd]">
                      {(Number(currentPosition.avgPrice ?? 0) * 100).toFixed(1)}¢
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#555]">Current value</span>
                    <span className="text-[#ddd]">
                      ${Number(currentPosition.currentValue ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#555]">P&L</span>
                    <span
                      className={`font-bold ${
                        Number(currentPosition.cashPnl ?? 0) >= 0
                          ? "text-[#39FF14]"
                          : "text-[#FF003C]"
                      }`}
                    >
                      {Number(currentPosition.cashPnl ?? 0) >= 0 ? "+" : ""}
                      ${Number(currentPosition.cashPnl ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : !positionsLoading ? (
                <div className="text-[10px] text-[#555]">
                  No {labelFor(selectedOutcome)} position found for this market.
                </div>
              ) : null}

              {/* Shares input */}
              <div>
                <div className="label mb-1.5">Shares to sell</div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={sellShares}
                    onChange={(e) => setSellShares(e.target.value)}
                    placeholder="0.00"
                    className="input w-full px-3 py-2.5 text-base font-bold tabular-nums pr-14"
                  />
                  {positionShares > 0 && (
                    <button
                      onClick={() => setSellShares(positionShares.toFixed(1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#FF003C] hover:text-white transition-colors"
                    >
                      MAX
                    </button>
                  )}
                </div>
              </div>

              {/* Slippage */}
              <div>
                <div className="label mb-1.5">Slippage %</div>
                <input
                  type="number"
                  min={MIN_SLIPPAGE}
                  max={MAX_SLIPPAGE}
                  step="any"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  placeholder="5"
                  className="input w-full px-3 py-2 text-[12px] font-bold tabular-nums"
                />
              </div>

              {/* Sell estimate */}
              {parseFloat(sellShares) > 0 && selectedPrice > 0 && (
                <div className="space-y-1.5 text-[10px] tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-[#555]">Sell price</span>
                    <span className="text-[#ddd] font-bold">
                      {Math.round(selectedPrice * 100)}¢
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#555]">Est. USDC received</span>
                    <span className="text-white font-bold">
                      ~${(parseFloat(sellShares) * selectedPrice).toFixed(2)}
                    </span>
                  </div>
                  <div className="divider" />
                  <div className="text-[9px] text-[#555]">
                    USDC is auto-bridged back to SOL. Gas covered by platform.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quote info (buy only) */}
          {tab === "buy" && quote && usdcEstimate > 0 && (
            <div className="space-y-1.5 text-[10px] tabular-nums">
              <div className="flex justify-between">
                <span className="text-[#555]">Avg price</span>
                <span className="text-[#ddd] font-bold">
                  {Math.round(selectedPrice * 100)}¢
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#555]">Est. USDC</span>
                <span className="text-[#ddd] font-bold">~${usdcEstimate.toFixed(2)}</span>
              </div>
              {selectedPrice > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#555]">Shares</span>
                    <span className="text-[#ddd] font-bold">{sharesEstimate.toFixed(1)}</span>
                  </div>
                  <div className="divider" />
                  <div className="flex justify-between">
                    <span className="text-[#555]">Payout if {labelFor(selectedOutcome)}</span>
                    <span className="text-white font-bold">${payoutEstimate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#555]">Potential profit</span>
                    <span className="text-[#39FF14] font-bold">
                      +${profitEstimate.toFixed(2)} ({returnPct.toFixed(0)}%)
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Live step progress */}
          {steps.length > 0 && (
            <div className="space-y-2">
              <div className="label">Progress</div>
              <div className="space-y-1.5">
                {steps.map((step, i) => {
                  const color = STEP_COLORS[step.status] ?? "#444";
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0 mt-0.5 border ${
                          step.status === "in_progress" ? "animate-pulse" : ""
                        }`}
                        style={{
                          borderColor: color,
                          color: step.status === "pending" ? "#444" : "#000",
                          background: step.status === "pending" ? "transparent" : color,
                        }}
                      >
                        {step.status === "completed"
                          ? "✓"
                          : step.status === "failed"
                            ? "✗"
                            : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[10px] font-bold capitalize truncate"
                          style={{ color: step.status === "pending" ? "#444" : color }}
                        >
                          {step.step.replace(/_/g, " ")}
                        </div>
                        {step.detail && (
                          <div className="text-[9px] text-[#555] truncate">{step.detail}</div>
                        )}
                        {step.tx_signature && (
                          <a
                            href={`https://solscan.io/tx/${step.tx_signature}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[9px] text-[#00F0FF] hover:text-white transition-colors tabular-nums"
                          >
                            {shortSig(step.tx_signature)}
                            <ExternalLink size={8} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error — MARKET_RESOLVED gets a friendlier message because it's a
              race (market resolved between fetch and click), not a real
              failure on the user's side. */}
          {error && (
            <div className="border border-[#FF003C]/30 bg-[#FF003C]/8 p-2.5 text-[#FF003C] text-[10px]">
              {error.startsWith("MARKET_RESOLVED")
                ? "This market just resolved before your order could be placed. Try a different market."
                : error}
            </div>
          )}

          {/* Success */}
          {result?.success && (
            <div className="border border-[#39FF14]/30 bg-[#39FF14]/8 p-2.5 text-[#39FF14] text-[10px] space-y-1.5">
              <div className="font-bold uppercase tracking-wider">
                {tab === "sell" ? "Sell complete" : "Trade complete"}
              </div>
              {tab === "buy" && positionsLoading && (
                <div className="text-[#888]">Loading position…</div>
              )}
              {tab === "buy" && currentPosition && positionShares > 0 && (
                <div className="text-[#ddd] tabular-nums">
                  You own <span className="font-bold">{positionShares.toFixed(1)}</span>{" "}
                  {labelFor(selectedOutcome)} shares @ avg{" "}
                  {(Number(currentPosition.avgPrice ?? 0) * 100).toFixed(1)}¢
                </div>
              )}
              <button
                onClick={reset}
                className="btn-ghost w-full py-1.5 text-[10px] font-bold"
              >
                Reset
              </button>
            </div>
          )}

          {/* Tradability warnings — shown above the execute button so the
              user sees them in the natural reading flow before clicking. */}
          {marketStatus === "thin" && (
            <div className="badge badge-yellow w-full px-2.5 py-2 text-[9px] normal-case tracking-normal items-start">
              <AlertTriangle size={11} className="flex-shrink-0 mt-px" />
              <span>Limited liquidity — slippage may apply on larger orders.</span>
            </div>
          )}
          {marketStatus === "no-activity" && !showNoActivityConfirm && (
            <div className="flex items-start gap-2 border border-white/10 bg-white/[0.04] p-2.5 text-[9px] text-[#888]">
              <AlertTriangle size={11} className="flex-shrink-0 mt-px" />
              <span>
                No recent trades — your order may not fill. You&apos;ll be asked to
                confirm.
              </span>
            </div>
          )}

          {/* No-activity inline confirm step — appears when the user clicks
              Buy on a market with zero recent trades. They can override and
              place anyway, but only after explicit acknowledgement. */}
          {showNoActivityConfirm && (
            <div className="border border-[#FAFF00]/30 bg-[#FAFF00]/5 p-3 space-y-2.5">
              <div className="flex items-start gap-2">
                <AlertTriangle size={13} className="flex-shrink-0 mt-0.5 text-[#FAFF00]" />
                <div>
                  <p className="text-[10px] font-bold text-[#FAFF00] uppercase tracking-wider">
                    No recent activity
                  </p>
                  <p className="mt-1 text-[9px] text-[#888] leading-relaxed">
                    This market has no recent trades. Your order may take longer
                    than usual to fill or may not fill at all. Continue anyway?
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNoActivityConfirm(false)}
                  className="btn-ghost flex-1 py-1.5 text-[10px] font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowNoActivityConfirm(false);
                    performExecute();
                  }}
                  className="flex-1 py-1.5 text-[10px] font-bold bg-[#FAFF00] text-black hover:opacity-90 transition-opacity"
                >
                  Place anyway
                </button>
              </div>
            </div>
          )}

          {/* Execute / connect notice */}
          {!phantomAddress ? (
            <div
              className="w-full py-3 text-center text-[10px] font-bold uppercase tracking-widest text-[#555] border border-white/8 cursor-not-allowed"
              title="Connect your wallet from the top bar to trade"
            >
              Connect wallet to trade
            </div>
          ) : (
            <button
              onClick={handleExecute}
              disabled={executeDisabled}
              title={marketStatus === "closed" ? STATUS_META.closed.description : undefined}
              className={`w-full py-3 font-bold text-[12px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                tab === "sell" || selectedOutcome === "No"
                  ? "bg-[#FF003C] text-white hover:opacity-90"
                  : "btn-primary"
              }`}
            >
              {marketStatus === "closed" && <Lock size={12} />}
              {marketStatus === "closed"
                ? "Market closed"
                : isExecuting
                  ? "Executing…"
                  : tab === "sell"
                    ? `Sell ${labelFor(selectedOutcome)}`
                    : `Buy ${labelFor(selectedOutcome)}`}
            </button>
          )}
        </>
      )}

      {!selectedOutcome && marketStatus !== "closed" && (
        <div className="text-[9px] text-[#555] text-center tracking-wider">
          Select an outcome to trade
        </div>
      )}

      {/* Shareable PnL card — only ever fed by a real fetched position */}
      {sharePos && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSharePos(null)}
        >
          <div className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setSharePos(null)}
                className="text-[#666] hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <PredictionPnLCard
              title={sharePos.title}
              outcome={sharePos.outcome}
              size={Number(sharePos.size ?? 0)}
              avgPrice={Number(sharePos.avgPrice ?? 0)}
              curPrice={Number(sharePos.curPrice ?? 0)}
              cashPnl={Number(sharePos.cashPnl ?? 0)}
              percentPnl={Number(sharePos.percentPnl ?? 0)}
              currentValue={Number(sharePos.currentValue ?? 0)}
              shareUrl={`${config.siteUrl}/prediction/${event?.slug ?? ""}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
