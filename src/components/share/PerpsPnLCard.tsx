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
  const prefix = isPositive ? '+' : '';
  const sideColor = side === 'long' ? '#39FF14' : '#FF003C';

  const tweetText = `${simulated ? '[SIMULATED] ' : ''}${prefix}${roePct.toFixed(1)}% ROE on ${coin}-PERP ${isPositive ? '🟢' : '🔴'}\n\n${side.toUpperCase()} ${leverage}x · entry $${px(entryPx)} → mark $${px(markPx)}\n\nPerps on BAGS Terminal`;

  return (
    <ShareCardWrapper tweetText={tweetText} filename={`bags-perps-${coin.toLowerCase()}`}>
      <div style={{ fontFamily: mono, position: 'relative', minHeight: 220 }}>
        {/* Accent glow */}
        <div style={{
          position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 220, height: 220, borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}15 0%, transparent 70%)`,
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

          {/* Details bar */}
          <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
            {[
              { label: 'ENTRY', value: `$${px(entryPx)}`, color: '#888' },
              { label: 'MARK', value: `$${px(markPx)}`, color: '#fff' },
              { label: 'MARGIN', value: `$${marginUsd.toFixed(2)}`, color: '#888' },
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
