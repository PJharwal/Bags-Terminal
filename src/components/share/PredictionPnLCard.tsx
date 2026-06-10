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
  const prefix = isPositive ? '+' : '';
  const isYes = outcome.toLowerCase() === 'yes';
  const outcomeColor = isYes ? '#39FF14' : '#FF003C';

  const tweetText = `${prefix}${percentPnl.toFixed(1)}% on "${title}" ${isPositive ? '🟢' : '🔴'}\n\n${outcome.toUpperCase()} · avg ${cents(avgPrice)} → now ${cents(curPrice)}\n\nPrediction markets on BAGS Terminal`;

  return (
    <ShareCardWrapper tweetText={tweetText} filename="bags-prediction-pnl" shareUrl={shareUrl}>
      <div style={{ fontFamily: mono, position: 'relative', minHeight: 230 }}>
        {/* Accent glow */}
        <div style={{
          position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 220, height: 220, borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}15 0%, transparent 70%)`,
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
            <div style={{ fontSize: 18, fontFamily: mono, color: accent, marginTop: 6, opacity: 0.8 }}>
              {prefix}${Math.abs(cashPnl).toFixed(2)}
            </div>
          </div>

          {/* Details bar */}
          <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
            {[
              { label: 'AVG', value: cents(avgPrice), color: '#888' },
              { label: 'NOW', value: cents(curPrice), color: '#fff' },
              { label: 'SHARES', value: size.toLocaleString(undefined, { maximumFractionDigits: 1 }), color: '#888' },
              { label: 'VALUE', value: `$${currentValue.toFixed(2)}`, color: '#fff' },
            ].map((item, i) => (
              <div key={item.label} style={{
                flex: 1, textAlign: 'center',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
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
