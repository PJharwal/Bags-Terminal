'use client';

import { ShareCardWrapper } from './ShareCardWrapper';

interface FeeEarningsCardProps {
  totalFeesEarned: number;
  totalFeesClaimed: number;
  tokensCreated: number;
  claimCount: number;
  topToken?: { symbol: string; fees: number };
  walletAddress: string;
}

const mono = "'Courier New', Courier, monospace";

export function FeeEarningsCard({
  totalFeesEarned, totalFeesClaimed, tokensCreated,
  claimCount, topToken, walletAddress,
}: FeeEarningsCardProps) {
  const truncatedWallet = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  const claimRatio = totalFeesEarned > 0 ? (totalFeesClaimed / totalFeesEarned) * 100 : 0;

  const tweetText = `Earned ${totalFeesEarned.toFixed(4)} SOL in fees on bags.fm\n\n${tokensCreated} tokens created\n${claimCount} claims made\n\nLaunch tokens with built-in fee sharing\nbags.fm`;

  return (
    <ShareCardWrapper tweetText={tweetText} filename="bags-fees">
      <div style={{ fontFamily: mono, position: 'relative', minHeight: 220 }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 240, height: 240, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,215,0,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Top bar: Label + Wallet */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 24, height: 24, backgroundColor: 'rgba(255,215,0,0.15)',
                border: '1px solid rgba(255,215,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 12, fontWeight: 'bold', color: '#FFD700', fontFamily: mono }}>$</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 'bold', color: '#FFD700', fontFamily: mono, letterSpacing: '0.15em' }}>
                FEE EARNINGS
              </span>
            </div>
            <div style={{
              padding: '3px 8px', backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{ fontSize: 10, color: '#666', fontFamily: mono }}>{truncatedWallet}</span>
            </div>
          </div>

          {/* Hero SOL amount */}
          <div style={{ textAlign: 'center', padding: '4px 0 8px' }}>
            <div style={{
              fontSize: 52, fontWeight: 'bold', fontFamily: mono, color: '#39FF14',
              lineHeight: 1, letterSpacing: '-0.02em',
              textShadow: '0 0 30px rgba(57,255,20,0.4), 0 0 60px rgba(57,255,20,0.2)',
            }}>
              {totalFeesEarned.toFixed(4)}
            </div>
            <div style={{
              fontSize: 16, fontFamily: mono, color: 'rgba(57,255,20,0.6)', marginTop: 6,
              letterSpacing: '0.2em',
            }}>
              SOL EARNED
            </div>
          </div>

          {/* Claim progress bar */}
          <div style={{ margin: '16px 0', padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 9, color: '#555', fontFamily: mono, letterSpacing: '0.1em' }}>CLAIMED</span>
              <span style={{ fontSize: 9, color: '#888', fontFamily: mono }}>{totalFeesClaimed.toFixed(4)} / {totalFeesEarned.toFixed(4)} SOL</span>
            </div>
            <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${Math.min(claimRatio, 100)}%`,
                backgroundColor: '#39FF14', boxShadow: '0 0 8px rgba(57,255,20,0.5)',
              }} />
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: topToken ? '1fr 1fr 1fr' : '1fr 1fr', gap: 1, backgroundColor: 'rgba(255,255,255,0.04)' }}>
            {[
              { label: 'TOKENS CREATED', value: String(tokensCreated), color: '#fff' },
              { label: 'TOTAL CLAIMS', value: String(claimCount), color: '#fff' },
              ...(topToken ? [{ label: 'TOP EARNER', value: `$${topToken.symbol}`, color: '#FFD700' }] : []),
            ].map((stat) => (
              <div key={stat.label} style={{ padding: '12px 10px', backgroundColor: '#050505' }}>
                <div style={{ fontSize: 9, color: '#555', fontFamily: mono, letterSpacing: '0.12em', marginBottom: 6 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 16, fontWeight: 'bold', fontFamily: mono, color: stat.color }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Top earner fees detail */}
          {topToken && topToken.fees > 0 && (
            <div style={{
              marginTop: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.12)',
            }}>
              <span style={{ fontSize: 10, color: '#888', fontFamily: mono }}>${topToken.symbol} fees</span>
              <span style={{ fontSize: 12, fontWeight: 'bold', color: '#FFD700', fontFamily: mono }}>{topToken.fees.toFixed(4)} SOL</span>
            </div>
          )}
        </div>
      </div>
    </ShareCardWrapper>
  );
}
