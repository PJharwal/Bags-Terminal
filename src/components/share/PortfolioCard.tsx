'use client';

import { ShareCardWrapper } from './ShareCardWrapper';
import { formatCurrency } from '@/lib/format';

interface PortfolioCardProps {
  tokensCreated: number;
  totalMarketCap: number;
  totalVolume: number;
  totalFeesEarned: number;
  bestToken?: { symbol: string; marketCap: number };
  walletAddress: string;
}

const mono = "'Courier New', Courier, monospace";

export function PortfolioCard({
  tokensCreated, totalMarketCap, totalVolume,
  totalFeesEarned, bestToken, walletAddress,
}: PortfolioCardProps) {
  const truncatedWallet = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  const tweetText = `My BAGS creator portfolio\n\n${tokensCreated} tokens launched\nTotal MC: ${formatCurrency(totalMarketCap)}\nFees earned: ${totalFeesEarned.toFixed(4)} SOL\n\nbags.fm`;

  return (
    <ShareCardWrapper tweetText={tweetText} filename="bags-portfolio">
      <div style={{ fontFamily: mono, position: 'relative', minHeight: 220 }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 220, height: 220, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,240,255,0.1) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 4, height: 18, backgroundColor: '#00F0FF' }} />
              <span style={{ fontSize: 11, fontWeight: 'bold', color: '#00F0FF', fontFamily: mono, letterSpacing: '0.15em' }}>
                CREATOR PORTFOLIO
              </span>
            </div>
            <div style={{
              padding: '3px 8px', backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{ fontSize: 10, color: '#666', fontFamily: mono }}>{truncatedWallet}</span>
            </div>
          </div>

          {/* Hero: Tokens Created count */}
          <div style={{ textAlign: 'center', padding: '0 0 16px' }}>
            <div style={{
              fontSize: 56, fontWeight: 'bold', fontFamily: mono, color: '#fff',
              lineHeight: 1, letterSpacing: '-0.02em',
            }}>
              {tokensCreated}
            </div>
            <div style={{
              fontSize: 12, fontFamily: mono, color: '#555', marginTop: 6,
              letterSpacing: '0.2em',
            }}>
              TOKENS LAUNCHED
            </div>
          </div>

          {/* Stats 2x2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, backgroundColor: 'rgba(255,255,255,0.04)' }}>
            {[
              { label: 'TOTAL MARKET CAP', value: formatCurrency(totalMarketCap), color: '#39FF14' },
              { label: 'TOTAL VOLUME', value: formatCurrency(totalVolume), color: '#00F0FF' },
              { label: 'FEES EARNED', value: `${totalFeesEarned.toFixed(4)} SOL`, color: '#FFD700' },
              { label: 'AVG MC/TOKEN', value: tokensCreated > 0 ? formatCurrency(totalMarketCap / tokensCreated) : '$0', color: '#888' },
            ].map((stat) => (
              <div key={stat.label} style={{ padding: '12px 10px', backgroundColor: '#050505' }}>
                <div style={{ fontSize: 9, color: '#555', fontFamily: mono, letterSpacing: '0.12em', marginBottom: 6 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 'bold', fontFamily: mono, color: stat.color }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Best performer */}
          {bestToken && (
            <div style={{
              marginTop: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: 'rgba(57,255,20,0.04)', border: '1px solid rgba(57,255,20,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, backgroundColor: '#39FF14', boxShadow: '0 0 6px #39FF14' }} />
                <span style={{ fontSize: 10, color: '#888', fontFamily: mono, letterSpacing: '0.1em' }}>BEST PERFORMER</span>
              </div>
              <div>
                <span style={{ fontSize: 13, fontWeight: 'bold', color: '#39FF14', fontFamily: mono }}>${bestToken.symbol}</span>
                <span style={{ fontSize: 11, color: '#666', fontFamily: mono, marginLeft: 8 }}>MC {formatCurrency(bestToken.marketCap)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </ShareCardWrapper>
  );
}
