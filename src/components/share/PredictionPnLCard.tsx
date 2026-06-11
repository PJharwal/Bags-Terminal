'use client';

import { ShareCardWrapper } from './ShareCardWrapper';
import { ScanStrip } from './ScanStrip';

interface PredictionPnLCardProps {
  /** All values map 1:1 from a real PolyPosition — never synthesized. */
  title: string;
  outcome: string; // "Yes" | "No" | outcome label
  size: number; // shares
  avgPrice: number; // 0–1
  curPrice: number; // 0–1
  cashPnl: number; // USD
  percentPnl: number;
  currentValue: number; // USD
  shareUrl?: string;
}

const mono = "'Courier New', Courier, monospace";

const cents = (p: number) => `${(p * 100).toFixed(1)}¢`;

export function PredictionPnLCard({
  title, outcome, size, avgPrice, curPrice, cashPnl, percentPnl, currentValue, shareUrl,
}: PredictionPnLCardProps) {
  const isPositive = percentPnl >= 0;
  const accent = isPositive ? '#39FF14' : '#FF003C';
  const prefix = isPositive ? '+' : '-'; // paired with Math.abs below — a loss must read "-33.9%"
  const isYes = outcome.toLowerCase() === 'yes';
  const outcomeColor = isYes ? '#39FF14' : '#FF003C';
  // Glow scales with the size of the move (capped) — big wins/losses radiate harder.
  const glowAlpha = Math.min(0.32, 0.12 + Math.abs(percentPnl) / 400);
  const multiplier = avgPrice > 0 ? curPrice / avgPrice : null;

  const tweetText = `${prefix}${Math.abs(percentPnl).toFixed(1)}% on "${title}" ${isPositive ? '🟢' : '🔴'}\n\n${outcome.toUpperCase()} · avg ${cents(avgPrice)} → now ${cents(curPrice)}\n\nPrediction markets on BAGS Terminal`;

  return (
    <ShareCardWrapper tweetText={tweetText} filename="bags-prediction-pnl" shareUrl={shareUrl}>
      <div style={{ fontFamily: mono, position: 'relative', minHeight: 230 }}>
        {/* Terminal grid backdrop */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse at 50% 40%, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 30%, transparent 80%)',
        }} />
        {/* Accent edge bar */}
        <div style={{
          position: 'absolute', left: -16, top: 8, bottom: 8, width: 3,
          background: `linear-gradient(180deg, transparent, ${accent}aa, transparent)`,
          borderRadius: 2, pointerEvents: 'none',
        }} />
        {/* Accent glow — intensity tracks PnL magnitude */}
        <div style={{
          position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 240, height: 240, borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${isPositive ? '57,255,20' : '255,0,60'},${glowAlpha}) 0%, transparent 70%)`,
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header: kicker + outcome badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 10, color: '#00F0FF', letterSpacing: '0.2em', fontFamily: mono, fontWeight: 'bold' }}>
              PREDICTION MARKET
            </span>
            <span style={{
              padding: '3px 10px', fontFamily: mono, fontSize: 11, fontWeight: 'bold',
              color: outcomeColor, backgroundColor: `${outcomeColor}15`,
              border: `1px solid ${outcomeColor}40`, borderRadius: 6,
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              {outcome}
            </span>
          </div>

          {/* Market title */}
          <div style={{
            fontSize: 14, fontWeight: 'bold', color: '#fff', fontFamily: mono,
            lineHeight: 1.35, marginBottom: 14, maxHeight: 57, overflow: 'hidden',
          }}>
            {title}
          </div>

          {/* Hero PnL */}
          <div style={{ textAlign: 'center', padding: '4px 0 16px' }}>
            <div style={{
              fontSize: 52, fontWeight: 'bold', fontFamily: mono, color: accent,
              lineHeight: 1, letterSpacing: '-0.02em',
              textShadow: `0 0 30px ${accent}50, 0 0 60px ${accent}25`,
            }}>
              {prefix}{Math.abs(percentPnl).toFixed(1)}%
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 6,
            }}>
              <span style={{ fontSize: 18, fontFamily: mono, color: accent, opacity: 0.8 }}>
                {prefix}${Math.abs(cashPnl).toFixed(2)}
              </span>
              {multiplier !== null && (
                <span style={{
                  padding: '2px 8px', fontSize: 11, fontWeight: 'bold', fontFamily: mono,
                  color: accent, backgroundColor: `${accent}14`, border: `1px solid ${accent}40`,
                  borderRadius: 5, letterSpacing: '0.06em',
                }}>
                  {multiplier.toFixed(2)}x
                </span>
              )}
            </div>
          </div>

          {/* Price rail: 0–100¢ with avg→now journey */}
          <div style={{ padding: '0 4px 14px' }}>
            <div style={{ position: 'relative', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}>
              <div style={{
                position: 'absolute', top: 0, bottom: 0, borderRadius: 3,
                left: `${Math.min(avgPrice, curPrice) * 100}%`,
                width: `${Math.abs(curPrice - avgPrice) * 100}%`,
                background: `linear-gradient(90deg, ${accent}30, ${accent}90)`,
              }} />
              <div style={{
                position: 'absolute', top: -2, width: 10, height: 10, borderRadius: '50%',
                left: `calc(${avgPrice * 100}% - 5px)`,
                background: '#666', border: '2px solid #0A0A0A',
              }} />
              <div style={{
                position: 'absolute', top: -2, width: 10, height: 10, borderRadius: '50%',
                left: `calc(${curPrice * 100}% - 5px)`,
                background: accent, border: '2px solid #0A0A0A',
                boxShadow: `0 0 8px ${accent}90`,
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 8, color: '#555', fontFamily: mono, letterSpacing: '0.1em' }}>
              <span>0¢</span>
              <span style={{ color: '#888' }}>AVG {cents(avgPrice)} → <span style={{ color: accent }}>NOW {cents(curPrice)}</span></span>
              <span>$1</span>
            </div>
          </div>

          {/* Details bar */}
          <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
            {[
              { label: 'SHARES', value: size.toLocaleString(undefined, { maximumFractionDigits: 1 }), color: '#888' },
              { label: 'VALUE', value: `$${currentValue.toFixed(2)}`, color: '#fff' },
              { label: 'TO WIN', value: `$${size.toFixed(2)}`, color: '#888' }, // shares pay $1 each on win
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

          <ScanStrip url={shareUrl || 'https://www.bagsterminal.fm/prediction'} accent={accent} />
        </div>
      </div>
    </ShareCardWrapper>
  );
}
