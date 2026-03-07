'use client';

import { useCallback, useState, type RefObject } from 'react';

export function useShareCard() {
  const [isCapturing, setIsCapturing] = useState(false);

  const captureCard = useCallback(async (ref: RefObject<HTMLDivElement | null>, filename = 'bags-terminal') => {
    if (!ref.current) return;
    setIsCapturing(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(ref.current, {
        backgroundColor: '#050505',
        pixelRatio: 2,
        quality: 1,
        skipFonts: true,
        style: {
          // Force styles that image capture can render
          fontFamily: "'Courier New', Courier, monospace",
        },
        filter: (node: HTMLElement) => {
          // Skip elements that break capture (animations, complex filters)
          if (node.classList?.contains('animate-spin')) return true;
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

  const shareToTwitter = useCallback((text: string) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://x.com/intent/tweet?text=${encoded}`, '_blank');
  }, []);

  return { captureCard, shareToTwitter, isCapturing };
}
