'use client';

import Link from 'next/link';
import { Rocket } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-16 h-16 border border-[#333] flex items-center justify-center">
        <Rocket size={24} className="text-[#444]" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-bold text-[#EDEDED]">No tokens launched yet</span>
        <span className="text-[10px] text-[#666] font-mono">
          Create your first token to start earning fees
        </span>
      </div>
      <Link
        href="/launch"
        className="flex items-center gap-2 px-5 py-2.5 bg-[#39FF14] text-black text-[11px] font-bold uppercase tracking-wider hover:brightness-110 transition-all"
      >
        <Rocket size={12} />
        Launch Your First Token
      </Link>
    </div>
  );
}
