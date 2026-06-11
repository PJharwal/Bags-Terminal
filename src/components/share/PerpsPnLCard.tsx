'use client';

import { ShareCardWrapper } from './ShareCardWrapper';
import { ScanStrip } from './ScanStrip';

interface PerpsPnLCardProps {
  coin: string;
  side: 'long' | 'short';
  leverage: number;
  entryPx: number;
  markPx: number;
  marginUsd: number;
  pnlUsd: number;
  roePct: number; // return on equity % (Hyperliquid convention)
  /**
   * true = values come from panel inputs, not a real fill. Renders a hard-baked
   * SIMULATED badge + watermark inside the captured pixels and prefixes the
   * tweet — a simulated card must never read as a real position.
   */
  simulated: boolean;
}

const mono = "'Courier New', Courier, monospace";
const GOLD = '#FFD700';

function px(n: number): string {
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (n >= 1) return n.toFixed(3);
  return n.toPrecision(3);
}

export function PerpsPnLCard({
  coin, side, leverage, entryPx, markPx, marginUsd, pnlUsd, roePct, simulated,
}: PerpsPnLCardProps) {
  const isPositive = roePct >= 0;
  const accent = isPositive ? '#39FF14' : '#FF003C';
  const prefix = isPositive ? '+' : '-'; // paired with Math.abs below — a loss must read "-26.2%"
  const sideColor = side === 'long' ? '#39FF14' : '#FF003C';
  // Glow scales with the size of the move (capped).
  const glowAlpha = Math.min(0.32, 0.12 + Math.abs(roePct) / 400);
  // Entry→mark rail, padded so both markers sit inside the track.
  const lo = Math.min(entryPx, markPx);
  const hi = Math.max(entryPx, markPx);
  const span = Math.max(hi - lo, hi * 0.001);
  const railLo = lo - span * 0.35;
  const railSpan = span * 1.7;
  const pos = (v: number) => `${((v - railLo) / railSpan) * 100}%`;

  const tweetText = `${simulated ? '[SIMULATED] ' : ''}${prefix}${Math.abs(roePct).toFixed(1)}% ROE on ${coin}-PERP ${isPositive ? '🟢' : '🔴'}\n\n${side.toUpperCase()} ${leverage}x · entry $${px(entryPx)} → mark $${px(markPx)}\n\nPerps on BAGS Terminal`;

  return (
    <ShareCardWrapper tweetText={tweetText} filename={`bags-perps-${coin.toLowerCase()}`}>
      <div style={{ fontFamily: mono, position: 'relative', minHeight: 220 }}>
        {/* Terminal grid backdrop */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse at 50% 40%, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 30%, transparent 80%)',
        }} />
        {/* Side edge bar */}
        <div style={{
          position: 'absolute', left: -16, top: 8, bottom: 8, width: 3,
          background: `linear-gradient(180deg, transparent, ${sideColor}aa, transparent)`,
          borderRadius: 2, pointerEvents: 'none',
        }} />
        {/* Accent glow — intensity tracks ROE magnitude */}
        <div style={{
          position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 240, height: 240, borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${isPositive ? '57,255,20' : '255,0,60'},${glowAlpha}) 0%, transparent 70%)`,
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        {/* Hard-baked SIMULATED badge — inside the captured pixels */}
        {simulated && (
          <div style={{
            position: 'absolute', top: 0, right: 0, zIndex: 2,
            padding: '3px 10px', fontFamily: mono, fontSize: 10, fontWeight: 'bold',
            color: GOLD, backgroundColor: `${GOLD}18`, border: `1px solid ${GOLD}66`,
            borderRadius: 6, letterSpacing: '0.18em',
          }}>
            SIMULATED
          </div>
        )}

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header: coin + side + leverage */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: 19, fontWeight: 'bold', color: '#fff', fontFamily: mono }}>
              {coin}-PERP
            </span>
            <span style={{
              padding: '2px 9px', fontFamily: mono, fontSize: 10, fontWeight: 'bold',
              color: side === 'long' ? '#000' : '#fff', backgroundColor: sideColor,
              borderRadius: 6, letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              {side}
            </span>
            <span style={{
              padding: '2px 9px', fontFamily: mono, fontSize: 10, fontWeight: 'bold',
              color: GOLD, backgroundColor: `${GOLD}15`, border: `1px solid ${GOLD}40`,
              borderRadius: 6,
            }}>
              {leverage}x
            </span>
          </div>

          {/* Hero ROE */}
          <div style={{ textAlign: 'center', padding: '6px 0 18px' }}>
            <div style={{
              fontSize: 56, fontWeight: 'bold', fontFamily: mono, color: accent,
              lineHeight: 1, letterSpacing: '-0.02em',
              textShadow: `0 0 30px ${accent}50, 0 0 60px ${accent}25`,
            }}>
              {prefix}{Math.abs(roePct).toFixed(1)}%
            </div>
            <div style={{ fontSize: 18, fontFamily: mono, color: accent, marginTop: 6, opacity: 0.8 }}>
              {prefix}${Math.abs(pnlUsd).toFixed(2)} · ROE
            </div>
          </div>

          {simulated && (
            <div style={{
              fontSize: 9, color: GOLD, fontFamily: mono, letterSpacing: '0.14em',
              textAlign: 'center', marginBottom: 10,
            }}>
              SIMULATED — NOT A REAL POSITION
            </div>
          )}

          {/* Price rail: entry → mark */}
          <div style={{ padding: '0 4px 14px' }}>
            <div style={{ position: 'relative', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}>
              <div style={{
                position: 'absolute', top: 0, bottom: 0, borderRadius: 3,
                left: pos(lo),
                width: `${(span / railSpan) * 100}%`,
                background: `linear-gradient(90deg, ${accent}30, ${accent}90)`,
              }} />
              <div style={{
                position: 'absolute', top: -2, width: 10, height: 10, borderRadius: '50%',
                left: `calc(${pos(entryPx)} - 5px)`,
                background: '#666', border: '2px solid #0A0A0A',
              }} />
              <div style={{
                position: 'absolute', top: -2, width: 10, height: 10, borderRadius: '50%',
                left: `calc(${pos(markPx)} - 5px)`,
                background: accent, border: '2px solid #0A0A0A',
                boxShadow: `0 0 8px ${accent}90`,
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 5, fontSize: 8, color: '#888', fontFamily: mono, letterSpacing: '0.1em' }}>
              <span>ENTRY ${px(entryPx)} → <span style={{ color: accent }}>MARK ${px(markPx)}</span></span>
            </div>
          </div>

          {/* Details bar */}
          <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
            {[
              { label: 'MARGIN', value: `$${marginUsd.toFixed(2)}`, color: '#888' },
              { label: 'NOTIONAL', value: `$${(marginUsd * leverage).toFixed(2)}`, color: '#fff' },
              { label: 'PNL', value: `${prefix}$${Math.abs(pnlUsd).toFixed(2)}`, color: accent },
            ].map((item, i) => (
              <div key={item.label} style={{
                flex: 1, textAlign: 'center',
                borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <div style={{ fontSize: 9, color: '#555', fontFamily: mono, letterSpacing: '0.15em', marginBottom: 4 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 12, color: item.color, fontFamily: mono, fontWeight: 'bold' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <ScanStrip url="https://www.bagsterminal.fm/perps" accent={GOLD} />
        </div>
      </div>
    </ShareCardWrapper>
  );
}
