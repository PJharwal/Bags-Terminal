import type { Metadata } from 'next';
import { ComingSoonMarket } from '@/components/ComingSoonMarket';

export const metadata: Metadata = {
  title: 'Cross-Chain Prediction Markets',
  description: 'Trade Polymarket with Solana funds — no manual bridge. Coming soon to BAGS Terminal.',
};

export default function PredictionPage() {
  return (
    <ComingSoonMarket
      tagline="Cross-Chain Prediction Markets"
      title="POLYMARKET, ZERO BRIDGING"
      accent="#00F0FF"
      status="In Testing"
      description="Trade the world's largest prediction market with your Solana funds — no manual bridge, no chain-switching. Solver infrastructure routes execution so you stay on Solana the whole time."
      points={[
        'Trade Polymarket directly with Solana funds',
        'No manual bridging — solver-routed execution',
        'One wallet, one interface for every market',
      ]}
      stat="~$10B"
      statLabel="Polymarket Monthly Volume (2026 peak)"
    />
  );
}
