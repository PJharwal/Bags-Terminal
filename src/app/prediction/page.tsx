import type { Metadata } from 'next';
import PredictionClient from './PredictionClient';

export const metadata: Metadata = {
  title: 'Prediction Markets',
  description:
    'Trade Polymarket live with your Solana funds — no manual bridge, no chain-switching. Solver-routed cross-chain execution from BAGS Terminal.',
  openGraph: {
    title: 'Prediction Markets · BAGS Terminal',
    description: 'Trade the outcome. Solana in, Solana out — live Polymarket markets.',
    url: '/prediction',
    images: [{ url: '/api/og?page=prediction&v=2', width: 1200, height: 630, alt: 'Prediction Markets on BAGS Terminal' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prediction Markets · BAGS Terminal',
    description: 'Trade the outcome. Solana in, Solana out — live Polymarket markets.',
    images: ['/api/og?page=prediction&v=2'],
  },
};

export default function PredictionPage() {
  return <PredictionClient />;
}
