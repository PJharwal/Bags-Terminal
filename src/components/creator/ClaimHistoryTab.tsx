'use client';

import { useCreatorStore } from '@/store/creator.store';
import { ExternalLink } from 'lucide-react';

export function ClaimHistoryTab() {
  const { claimHistory } = useCreatorStore();

  if (claimHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <span className="text-[11px] text-[#666] font-mono">No claim history yet.</span>
        <span className="text-[9px] text-[#444] font-mono">Claims will appear here after you collect fees.</span>
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
            className="flex items-center justify-between p-3 bg-[#0A0A0A] border border-white/10"
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#EDEDED] font-bold">{event.tokenSymbol}</span>
                <span className="text-[10px] font-mono text-[#39FF14]">+{event.amount.toFixed(4)} SOL</span>
              </div>
              <span className="text-[9px] text-[#666] font-mono">{timeStr}</span>
            </div>
            <a
              href={`https://solscan.io/tx/${event.signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[9px] font-mono text-[#888] hover:text-[#39FF14] transition-colors"
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
