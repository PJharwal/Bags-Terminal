'use client';

import Link from 'next/link';
import { Rocket } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-16 h-16 border border-white/[0.06] flex items-center justify-center bg-[#0A0A0A]">
        <Rocket size={24} className="text-[#333]" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-bold text-[#EDEDED]">No tokens launched yet</span>
        <span className="text-[10px] text-[#666] font-mono">
          Create your first token to start earning fees
        </span>
      </div>
      <Link
        href="/launch"
        className="btn-primary flex items-center gap-2 px-5 py-2.5 text-[11px]"
      >
        <Rocket size={12} />
        Launch Your First Token
      </Link>
    </div>
  );
}
