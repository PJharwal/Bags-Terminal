import type { Metadata } from 'next';
import PerpsClient from './PerpsClient';

export const metadata: Metadata = {
  title: 'Perps Terminal',
  description:
    'Live perpetual futures market data — mark prices, funding, open interest and order books across 200+ markets via Hyperliquid. Execution coming soon.',
  openGraph: {
    title: 'Perps Terminal · BAGS Terminal',
    description: 'Live perps market data — 200+ markets via Hyperliquid. Execution coming soon.',
    url: '/perps',
    images: [{ url: '/api/og?page=perps', width: 1200, height: 630, alt: 'Perps Terminal on BAGS Terminal' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Perps Terminal · BAGS Terminal',
    description: 'Live perps market data — 200+ markets via Hyperliquid. Execution coming soon.',
    images: ['/api/og?page=perps'],
  },
};

export default function PerpsPage() {
  return <PerpsClient />;
}
