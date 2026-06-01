import { Metadata } from 'next';
import { PulseContent } from '@/components/PulseContent';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Live Token Tracker | BAGS Terminal',
  description: 'Track real-time prices, liquidity, and volume of top Solana tokens on Axiom Pulse.',
  alternates: {
    canonical: '/pulse',
  },
};

export default function PulsePage() {
    return (
      <Providers>
        <PulseContent />
      </Providers>
    );
}
