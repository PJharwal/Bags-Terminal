import type { Metadata } from 'next';
import { ComingSoonMarket } from '@/components/ComingSoonMarket';

export const metadata: Metadata = {
  title: 'Cross-Chain Perps',
  description: 'Perpetual futures settled from a Solana-native interface — no manual bridging. Coming soon to BAGS Terminal.',
};

export default function PerpsPage() {
  return (
    <ComingSoonMarket
      tagline="Cross-Chain Perps"
      title="PERPS WITHOUT LEAVING SOLANA"
      accent="#FFD700"
      status="In Testing"
      description="Trade perpetual futures settled from a Solana-native UX. Solver infrastructure routes your margin across chains — you keep one wallet and one interface, with no manual bridging."
      points={[
        'One Solana wallet — spot and derivatives in a single terminal',
        'Margin routed cross-chain by solver infrastructure',
        'Settled on the dominant on-chain perp venue',
      ]}
      stat="~$500–700B"
      statLabel="Monthly Perp-DEX Volume (2026)"
    />
  );
}
