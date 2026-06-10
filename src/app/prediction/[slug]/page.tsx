import type { Metadata } from 'next';
import DetailClient from './DetailClient';
import { fetchPolyEvent } from '@/services/polymarket.service';
import { config } from '@/config/env';

function slugTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ogImage = `${config.siteUrl}/api/og?pmarket=${encodeURIComponent(slug)}`;

  // Try the live event (3s budget) for a real title/description; fall back
  // to the slug-derived title — never block the page on the backend.
  let title = slugTitle(slug);
  let description = `Trade "${title}" on Polymarket with Solana funds — live prices, history and cross-chain execution from BAGS Terminal.`;
  try {
    const event = await Promise.race([
      fetchPolyEvent(slug),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);
    if (event?.title) {
      title = event.title;
      const fm = event.markets?.[0];
      const yes = fm ? Math.round(parseFloat(fm.outcomePrices?.[0] ?? '') * 100) : NaN;
      const vol =
        event.volume >= 1e6
          ? `$${(event.volume / 1e6).toFixed(1)}M`
          : `$${Math.round(event.volume / 1e3)}K`;
      description = Number.isFinite(yes)
        ? `${yes}% chance · ${vol} volume — trade "${event.title}" with Solana funds on BAGS Terminal.`
        : `${vol} volume — trade "${event.title}" with Solana funds on BAGS Terminal.`;
    }
  } catch {
    /* fall back to slug-derived metadata */
  }

  return {
    title: `${title} · Prediction Markets`,
    description,
    openGraph: {
      title,
      description,
      url: `/prediction/${slug}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function PredictionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <DetailClient slug={slug} />;
}
