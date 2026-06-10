'use client';

import { useCallback, useState, type RefObject } from 'react';
import { config } from '@/config/env';

// Append UTM attribution to a shared URL without clobbering params already set
// (e.g. a referral link that already carries utm_source=referral).
function withUtm(url: string, campaign: string) {
  try {
    const base = config.siteUrl;
    const u = new URL(url, base);
    if (!u.searchParams.has('utm_source')) u.searchParams.set('utm_source', 'twitter');
    if (!u.searchParams.has('utm_medium')) u.searchParams.set('utm_medium', 'share_card');
    if (!u.searchParams.has('utm_campaign')) u.searchParams.set('utm_campaign', campaign);
    return u.toString();
  } catch {
    return url;
  }
}

export function useShareCard() {
  const [isCapturing, setIsCapturing] = useState(false);

  const captureCard = useCallback(async (ref: RefObject<HTMLDivElement | null>, filename = 'bags-terminal') => {
    if (!ref.current) return;
    setIsCapturing(true);
    try {
      const { toPng } = await import('html-to-image');
      // 1x1 transparent PNG used when a cross-origin image can't be inlined,
      // so a single CORS-blocked token logo never aborts the whole capture.
      const transparentPixel =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const dataUrl = await toPng(ref.current, {
        backgroundColor: '#050505',
        pixelRatio: 2,
        quality: 1,
        // Let cross-origin images fail soft instead of aborting the render.
        imagePlaceholder: transparentPixel,
        filter: (node) => {
          // Skip spinners / live-animation nodes that capture as a blur.
          if (node instanceof HTMLElement && node.classList?.contains('animate-spin')) {
            return false;
          }
          return true;
        },
      });

      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to capture card:', err);
      // Fallback: try html2canvas if html-to-image fails
      try {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(ref.current!, {
          backgroundColor: '#050505',
          scale: 2,
          useCORS: true,
          logging: false,
        });
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err2) {
        console.error('Fallback capture also failed:', err2);
      }
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const shareToTwitter = useCallback((text: string, url?: string, campaign = 'share_card') => {
    const params = new URLSearchParams({ text });
    // When a URL is provided, X auto-unfurls its Open Graph card in the post.
    if (url) params.set('url', withUtm(url, campaign));
    window.open(`https://x.com/intent/tweet?${params.toString()}`, '_blank');
  }, []);

  return { captureCard, shareToTwitter, isCapturing };
}
