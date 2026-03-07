'use client';

import { ShareCardWrapper } from './ShareCardWrapper';

interface TokenLaunchCardProps {
  tokenName: string;
  tokenSymbol: string;
  tokenImage?: string;
  initialBuyAmount: number;
  tokenMint: string;
  feeClaimersCount: number;
}

const mono = "'Courier New', Courier, monospace";

export function TokenLaunchCard({
  tokenName, tokenSymbol, tokenImage,
  initialBuyAmount, tokenMint, feeClaimersCount,
}: TokenLaunchCardProps) {
  const truncatedMint = `${tokenMint.slice(0, 6)}...${tokenMint.slice(-4)}`;

  const tweetText = `Just launched $${tokenSymbol} on bags.fm!\n\nInitial buy: ${initialBuyAmount} SOL\n${feeClaimersCount} fee earners sharing revenue\n\nLaunch your token with built-in fee sharing\nbags.fm`;

  return (
    <ShareCardWrapper tweetText={tweetText} filename={`bags-launch-${tokenSymbol.toLowerCase()}`}>
      <div style={{ fontFamily: mono, position: 'relative', minHeight: 220 }}>
        {/* Background glow - green launch energy */}
        <div style={{
          position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(57,255,20,0.1) 0%, transparent 70%)',
          filter: 'blur(50px)', pointerEvents: 'none',
        }} />

        {/* Scanline overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 3px)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* JUST LAUNCHED header */}
          <div style={{
            fontSize: 28, fontWeight: 'bold', fontFamily: mono, color: '#39FF14',
            letterSpacing: '0.08em', lineHeight: 1, marginBottom: 20,
            textShadow: '0 0 15px rgba(57,255,20,0.6), 0 0 30px rgba(57,255,20,0.3), 0 0 60px rgba(57,255,20,0.15)',
          }}>
            JUST_LAUNCHED
          </div>

          {/* Token info row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            {tokenImage ? (
              <img src={tokenImage} alt={tokenName} style={{
                width: 52, height: 52, objectFit: 'cover',
                border: '2px solid rgba(57,255,20,0.3)',
                boxShadow: '0 0 12px rgba(57,255,20,0.15)',
              }} />
            ) : (
              <div style={{
                width: 52, height: 52, backgroundColor: 'rgba(57,255,20,0.08)',
                border: '2px solid rgba(57,255,20,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 12px rgba(57,255,20,0.15)',
              }}>
                <span style={{ fontSize: 22, fontWeight: 'bold', fontFamily: mono, color: '#39FF14' }}>
                  {tokenSymbol.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', fontFamily: mono }}>{tokenName}</div>
              <div style={{ fontSize: 14, color: '#39FF14', fontFamily: mono, marginTop: 2 }}>${tokenSymbol}</div>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, backgroundColor: 'rgba(255,255,255,0.04)' }}>
            {[
              { label: 'INITIAL BUY', value: `${initialBuyAmount} SOL`, color: '#fff' },
              { label: 'FEE EARNERS', value: String(feeClaimersCount), color: '#39FF14' },
              { label: 'MINT', value: truncatedMint, color: '#00F0FF' },
            ].map((stat) => (
              <div key={stat.label} style={{ padding: '12px 10px', backgroundColor: '#050505' }}>
                <div style={{ fontSize: 9, color: '#555', fontFamily: mono, letterSpacing: '0.12em', marginBottom: 6 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 'bold', fontFamily: mono, color: stat.color }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Grid decoration */}
          <div style={{
            marginTop: 12, height: 20, width: '100%', opacity: 0.08,
            backgroundImage: 'repeating-linear-gradient(90deg, #39FF14 0px, #39FF14 1px, transparent 1px, transparent 8px), repeating-linear-gradient(0deg, #39FF14 0px, #39FF14 1px, transparent 1px, transparent 8px)',
          }} />
        </div>
      </div>
    </ShareCardWrapper>
  );
}
