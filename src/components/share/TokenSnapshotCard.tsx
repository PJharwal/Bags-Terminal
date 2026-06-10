'use client';

import { ShareCardWrapper } from './ShareCardWrapper';
import { formatCurrency, formatNumber } from '@/lib/format';

interface TokenSnapshotCardProps {
  tokenSymbol: string;
  tokenName: string;
  tokenImage?: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  liquidity: number;
  lifetimeFees?: number;
  hasBagsFees?: boolean;
  /** Public token URL; passed to the X share so its OG card unfurls. */
  shareUrl?: string;
}

const mono = "'Courier New', Courier, monospace";

export function TokenSnapshotCard({
  tokenSymbol, tokenName, tokenImage,
  price, priceChange24h, marketCap, volume24h,
  holders, liquidity, lifetimeFees, hasBagsFees, shareUrl,
}: TokenSnapshotCardProps) {
  const isPositive = priceChange24h >= 0;
  const changeColor = isPositive ? '#39FF14' : '#FF003C';
  const changePrefix = isPositive ? '+' : '';

  // URL is passed via shareUrl (X unfurls the token OG card); omit it from the
  // text. Only include holders when we actually have a count.
  const sym = tokenSymbol || 'UNK';
  const holdersLine = holders > 0 ? `\nHolders: ${formatNumber(holders)}` : '';
  const tweetText = `$${sym} on BAGS Terminal 📊\n\nPrice: $${price}\n24h: ${changePrefix}${priceChange24h.toFixed(1)}%\nMC: ${formatCurrency(marketCap)}\nVol: ${formatCurrency(volume24h)}${holdersLine}${hasBagsFees ? `\nFees: ${lifetimeFees?.toFixed(4)} SOL` : ''}`;

  return (
    <ShareCardWrapper tweetText={tweetText} filename={`bags-snapshot-${sym.toLowerCase()}`} shareUrl={shareUrl}>
      <div style={{ fontFamily: mono }}>
        {/* Header: Token + Price + Change */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {tokenImage ? (
              <img src={tokenImage} alt={tokenSymbol} style={{ width: 44, height: 44, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
            ) : (
              <div style={{
                width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.08)',
                border: '2px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 18, fontWeight: 'bold', color: '#fff', fontFamily: mono }}>{sym[0]}</span>
              </div>
            )}
            <div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#fff', fontFamily: mono }}>${sym}</div>
              <div style={{ fontSize: 11, color: '#666', fontFamily: mono }}>{tokenName}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#fff', fontFamily: mono }}>${price < 0.01 ? price.toFixed(8) : price.toFixed(4)}</div>
            <div style={{
              display: 'inline-block', padding: '2px 8px', marginTop: 4,
              fontSize: 12, fontWeight: 'bold', fontFamily: mono,
              color: changeColor, backgroundColor: `${changeColor}12`,
              border: `1px solid ${changeColor}25`,
            }}>
              {changePrefix}{priceChange24h.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Bags Fee badge */}
        {hasBagsFees && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
            padding: '6px 10px', backgroundColor: 'rgba(57,255,20,0.06)',
            border: '1px solid rgba(57,255,20,0.15)',
          }}>
            <div style={{ width: 6, height: 6, backgroundColor: '#39FF14', boxShadow: '0 0 6px #39FF14' }} />
            <span style={{ fontSize: 10, fontWeight: 'bold', color: '#39FF14', fontFamily: mono, letterSpacing: '0.15em' }}>
              BAGS FEE SHARING ENABLED
            </span>
            {lifetimeFees !== undefined && lifetimeFees > 0 && (
              <span style={{ fontSize: 10, color: '#FFD700', fontFamily: mono, marginLeft: 'auto' }}>
                {lifetimeFees.toFixed(4)} SOL earned
              </span>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, backgroundColor: 'rgba(255,255,255,0.04)' }}>
          {[
            { label: 'MARKET CAP', value: formatCurrency(marketCap) },
            { label: 'VOLUME 24H', value: formatCurrency(volume24h) },
            { label: 'HOLDERS', value: holders > 0 ? formatNumber(holders) : '—' },
            { label: 'LIQUIDITY', value: formatCurrency(liquidity) },
            { label: '24H CHANGE', value: `${changePrefix}${priceChange24h.toFixed(1)}%`, color: changeColor },
            ...(hasBagsFees && lifetimeFees !== undefined
              ? [{ label: 'FEES EARNED', value: `${lifetimeFees.toFixed(4)} SOL`, color: '#FFD700' }]
              : [{ label: 'FDV', value: formatCurrency(marketCap) }]),
          ].map((stat) => (
            <div key={stat.label} style={{
              padding: '12px 10px', backgroundColor: '#050505',
            }}>
              <div style={{ fontSize: 9, color: '#555', fontFamily: mono, letterSpacing: '0.12em', marginBottom: 6 }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: 14, fontWeight: 'bold', fontFamily: mono,
                color: 'color' in stat && stat.color ? stat.color : '#fff',
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ShareCardWrapper>
  );
}
