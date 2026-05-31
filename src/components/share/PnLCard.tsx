'use client';

import { ShareCardWrapper } from './ShareCardWrapper';
import { formatCurrency } from '@/lib/format';

interface PnLCardProps {
  tokenSymbol: string;
  tokenName: string;
  tokenImage?: string;
  entryPrice: number;
  currentPrice: number;
  pnlPercent: number;
  pnlUsd: number;
  marketCap: number;
  /** Public token URL; passed to the X share so its OG card unfurls. */
  shareUrl?: string;
}

const mono = "'Courier New', Courier, monospace";

export function PnLCard({
  tokenSymbol, tokenName, tokenImage,
  entryPrice, currentPrice, pnlPercent, pnlUsd, marketCap, shareUrl,
}: PnLCardProps) {
  const isPositive = pnlPercent >= 0;
  const accentColor = isPositive ? '#39FF14' : '#FF003C';
  const prefix = isPositive ? '+' : '';
  const absPercent = Math.abs(pnlPercent);

  // URL is passed via shareUrl so X unfurls the token OG card.
  const tweetText = `${prefix}${pnlPercent.toFixed(1)}% on $${tokenSymbol} ${isPositive ? '🟢' : '🔴'}\n\nEntry: $${entryPrice.toFixed(6)}\nNow: $${currentPrice.toFixed(6)}\nMC: ${formatCurrency(marketCap)}\n\nTracked on BAGS Terminal`;

  return (
    <ShareCardWrapper tweetText={tweetText} filename={`bags-pnl-${tokenSymbol.toLowerCase()}`} shareUrl={shareUrl}>
      <div style={{ fontFamily: mono, position: 'relative', minHeight: 200 }}>
        {/* Background glow effect */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 200, height: 200, borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Top row: Token info + Trade type badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {tokenImage ? (
                <img src={tokenImage} alt={tokenSymbol} style={{ width: 40, height: 40, objectFit: 'cover', border: `2px solid ${accentColor}30` }} />
              ) : (
                <div style={{
                  width: 40, height: 40, backgroundColor: `${accentColor}15`,
                  border: `2px solid ${accentColor}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 16, fontWeight: 'bold', color: accentColor, fontFamily: mono }}>
                    {tokenSymbol[0]}
                  </span>
                </div>
              )}
              <div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#fff', fontFamily: mono }}>
                  ${tokenSymbol}
                </div>
                <div style={{ fontSize: 11, color: '#666', fontFamily: mono }}>{tokenName}</div>
              </div>
            </div>
            {/* PnL Badge */}
            <div style={{
              padding: '4px 12px', backgroundColor: `${accentColor}15`,
              border: `1px solid ${accentColor}40`, fontFamily: mono,
              fontSize: 11, fontWeight: 'bold', color: accentColor,
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              {isPositive ? 'PROFIT' : 'LOSS'}
            </div>
          </div>

          {/* Hero PnL Number */}
          <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
            <div style={{
              fontSize: 56, fontWeight: 'bold', fontFamily: mono, color: accentColor,
              lineHeight: 1, letterSpacing: '-0.02em',
              textShadow: `0 0 30px ${accentColor}50, 0 0 60px ${accentColor}25`,
            }}>
              {prefix}{absPercent.toFixed(1)}%
            </div>
            <div style={{
              fontSize: 20, fontFamily: mono, color: accentColor, marginTop: 8,
              opacity: 0.8,
            }}>
              {prefix}{formatCurrency(Math.abs(pnlUsd))}
            </div>
          </div>

          {/* Trade details bar */}
          <div style={{
            display: 'flex', borderTop: `1px solid rgba(255,255,255,0.06)`,
            paddingTop: 16,
          }}>
            {[
              { label: 'ENTRY', value: `$${entryPrice.toFixed(entryPrice < 0.001 ? 8 : 6)}`, color: '#888' },
              { label: 'CURRENT', value: `$${currentPrice.toFixed(currentPrice < 0.001 ? 8 : 6)}`, color: '#fff' },
              { label: 'MCAP', value: formatCurrency(marketCap), color: '#888' },
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
        </div>
      </div>
    </ShareCardWrapper>
  );
}
