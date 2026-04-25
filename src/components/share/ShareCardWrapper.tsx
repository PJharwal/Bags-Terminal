'use client';

import { useRef, type ReactNode } from 'react';
import { Download, Share2, Loader2 } from 'lucide-react';
import { useShareCard } from './useShareCard';

interface ShareCardWrapperProps {
  children: ReactNode;
  tweetText: string;
  filename?: string;
  compact?: boolean;
}

export function ShareCardWrapper({ children, tweetText, filename = 'bags-terminal', compact }: ShareCardWrapperProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { captureCard, shareToTwitter, isCapturing } = useShareCard();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Card Content — this gets captured. Uses inline styles for image capture compatibility */}
      <div
        ref={cardRef}
        style={{
          position: 'relative',
          backgroundColor: '#050505',
          border: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden',
          fontFamily: "'Courier New', Courier, monospace",
          color: '#EDEDED',
        }}
      >
        {/* Top accent line */}
        <div style={{
          height: '2px',
          background: 'linear-gradient(to right, #39FF14, #00F0FF, #39FF14)',
        }} />

        {/* Card body */}
        <div style={{ padding: compact ? '16px' : '24px' }}>
          {children}
        </div>

        {/* Branding footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0A0A0A',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '20px',
              height: '20px',
              backgroundColor: '#EDEDED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#000' }}>B</span>
            </div>
            <span style={{
              fontSize: '10px',
              fontFamily: "'Courier New', Courier, monospace",
              color: '#888',
              letterSpacing: '0.1em',
            }}>BAGS TERMINAL</span>
          </div>
          <span style={{
            fontSize: '10px',
            fontFamily: "'Courier New', Courier, monospace",
            color: 'rgba(57,255,20,0.6)',
          }}>bags.fm</span>
        </div>
      </div>

      {/* Action buttons — NOT captured */}
      <div className="flex gap-2">
        <button
          onClick={() => captureCard(cardRef, filename)}
          disabled={isCapturing}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-meta font-mono uppercase tracking-widest border border-white/10 text-fg-soft hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
        >
          {isCapturing ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
          {isCapturing ? 'Capturing...' : 'Save Image'}
        </button>
        <button
          onClick={() => shareToTwitter(tweetText)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-meta font-mono uppercase tracking-widest bg-acid-green/10 border border-[#39FF14]/20 text-acid-green hover:bg-acid-green/20 transition-colors"
        >
          <Share2 size={12} />
          Share on X
        </button>
      </div>
    </div>
  );
}
