'use client';

import { useCreatorStore } from '@/store/creator.store';
import { ExternalLink } from 'lucide-react';

export function ClaimHistoryTab() {
  const { claimHistory } = useCreatorStore();

  if (claimHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <span className="text-meta text-muted-high font-mono">No claim history yet.</span>
        <span className="text-meta text-[#444] font-mono">Claims will appear here after you collect fees.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {claimHistory.map((event) => {
        const date = new Date(event.timestamp);
        const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
          <div
            key={event.id}
            className="card flex items-center justify-between p-3"
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-meta font-mono text-fg font-bold">{event.tokenSymbol}</span>
                <span className="text-meta font-mono text-acid-green">+{event.amount.toFixed(4)} SOL</span>
              </div>
              <span className="text-meta text-muted-high font-mono">{timeStr}</span>
            </div>
            <a
              href={`https://solscan.io/tx/${event.signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-meta font-mono text-fg-soft hover:text-acid-green transition-colors"
            >
              <ExternalLink size={10} />
              {event.signature.slice(0, 6)}...{event.signature.slice(-4)}
            </a>
          </div>
        );
      })}
    </div>
  );
}
