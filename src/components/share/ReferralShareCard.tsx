'use client';

import { ShareCardWrapper } from './ShareCardWrapper';

interface ReferralShareCardProps {
  referralLink: string;
  tokensReferred: number;
  feesEarned: number;
  walletAddress: string;
}

const mono = "'Courier New', Courier, monospace";

export function ReferralShareCard({
  referralLink, tokensReferred, feesEarned, walletAddress,
}: ReferralShareCardProps) {
  const truncatedWallet = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  // Link is passed via shareUrl (X unfurls our OG card), so it's omitted here
  // to avoid the URL appearing twice in the post.
  const tweetText = `Earn fees when friends launch tokens on BAGS Terminal!\n\nUse my referral link to launch with built-in fee sharing 👇`;

  return (
    <ShareCardWrapper tweetText={tweetText} filename="bags-referral" shareUrl={referralLink}>
      <div style={{ fontFamily: mono, position: 'relative', minHeight: 220 }}>
        {/* Background glow - gold referral energy */}
        <div style={{
          position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 220, height: 220, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,215,0,0.1) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header with dividers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ height: 1, flex: 1, backgroundColor: 'rgba(255,215,0,0.25)' }} />
            <span style={{ fontSize: 11, fontWeight: 'bold', color: '#FFD700', letterSpacing: '0.2em', fontFamily: mono }}>
              REFERRAL PROGRAM
            </span>
            <div style={{ height: 1, flex: 1, backgroundColor: 'rgba(255,215,0,0.25)' }} />
          </div>

          {/* Hero stats - side by side */}
          <div style={{ display: 'flex', gap: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginBottom: 16 }}>
            <div style={{ flex: 1, padding: '16px 14px', backgroundColor: '#050505', textAlign: 'center' }}>
              <div style={{
                fontSize: 40, fontWeight: 'bold', fontFamily: mono, color: '#fff',
                lineHeight: 1,
              }}>
                {tokensReferred}
              </div>
              <div style={{ fontSize: 9, color: '#555', fontFamily: mono, letterSpacing: '0.15em', marginTop: 8 }}>
                TOKENS REFERRED
              </div>
            </div>
            <div style={{ flex: 1, padding: '16px 14px', backgroundColor: '#050505', textAlign: 'center' }}>
              <div style={{
                fontSize: 40, fontWeight: 'bold', fontFamily: mono, color: '#39FF14',
                lineHeight: 1,
                textShadow: '0 0 20px rgba(57,255,20,0.3)',
              }}>
                {feesEarned.toFixed(2)}
              </div>
              <div style={{ fontSize: 9, color: '#555', fontFamily: mono, letterSpacing: '0.15em', marginTop: 8 }}>
                SOL EARNED
              </div>
            </div>
          </div>

          {/* Referral link box */}
          <div style={{
            border: '1px solid rgba(57,255,20,0.2)', backgroundColor: 'rgba(57,255,20,0.03)',
            padding: '10px 12px', marginBottom: 16,
          }}>
            <div style={{ fontSize: 9, fontFamily: mono, color: '#555', letterSpacing: '0.1em', marginBottom: 4 }}>
              YOUR REFERRAL LINK
            </div>
            <div style={{ fontSize: 11, fontFamily: mono, color: '#39FF14', wordBreak: 'break-all' }}>
              {referralLink}
            </div>
          </div>

          {/* How it works - 3 steps */}
          <div style={{ display: 'flex', gap: 1, backgroundColor: 'rgba(255,255,255,0.04)' }}>
            {[
              { step: '1', label: 'SHARE LINK', color: '#00F0FF' },
              { step: '2', label: 'FRIENDS LAUNCH', color: '#00F0FF' },
              { step: '3', label: 'EARN FEES', color: '#39FF14' },
            ].map((item, i) => (
              <div key={item.step} style={{
                flex: 1, padding: '10px 8px', backgroundColor: '#050505',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}>
                <div style={{
                  width: 22, height: 22,
                  border: `1px solid ${item.color}40`, backgroundColor: `${item.color}10`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 'bold', color: item.color, fontFamily: mono }}>{item.step}</span>
                </div>
                <span style={{ fontSize: 8, color: '#888', fontFamily: mono, letterSpacing: '0.1em', textAlign: 'center' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Wallet footer */}
          <div style={{ marginTop: 10, textAlign: 'right' }}>
            <span style={{ fontSize: 10, color: '#444', fontFamily: mono }}>{truncatedWallet}</span>
          </div>
        </div>
      </div>
    </ShareCardWrapper>
  );
}
