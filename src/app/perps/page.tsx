import type { Metadata } from 'next';
import PerpsClient from './PerpsClient';

export const metadata: Metadata = {
  title: 'Perps Terminal',
  description:
    'Live perpetual futures market data — mark prices, funding, open interest and order books across 200+ markets via Hyperliquid. Execution coming soon.',
};

export default function PerpsPage() {
  return <PerpsClient />;
}
