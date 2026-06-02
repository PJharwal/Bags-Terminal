import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

interface ComingSoonMarketProps {
  title: string;
  accent: string;
  status: string;
  tagline: string;
  description: string;
  points: string[];
  stat: string;
  statLabel: string;
}

export function ComingSoonMarket({
  title, accent, status, tagline, description, points, stat, statLabel,
}: ComingSoonMarketProps) {
  return (
    <div className="min-h-[calc(100vh-92px)] bg-[#050505] text-[#EDEDED] font-mono flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Logo + status */}
        <div className="flex items-center gap-3 mb-6">
          <Image src="/bags-logo-official.png" alt="BAGS" width={36} height={36} />
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 border"
            style={{ color: accent, borderColor: `${accent}44`, backgroundColor: `${accent}11` }}
          >
            <span className="w-1.5 h-1.5 animate-pulse" style={{ backgroundColor: accent }} />
            {status}
          </span>
        </div>

        <div className="text-[10px] uppercase tracking-[0.2em] text-[#666] mb-3">{tagline}</div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight font-[family-name:var(--font-display)] leading-[1.05] mb-5">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-[#888] leading-relaxed mb-8 max-w-xl">{description}</p>

        <div className="flex flex-col gap-2.5 mb-8">
          {points.map((p) => (
            <div key={p} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#aaa]">
              <span className="mt-0.5 shrink-0" style={{ color: accent }}>▸</span>
              <span>{p}</span>
            </div>
          ))}
        </div>

        <div className="inline-block card p-5 mb-8">
          <div className="text-3xl font-bold" style={{ color: accent }}>{stat}</div>
          <div className="text-[10px] uppercase tracking-widest text-[#666] mt-1">{statLabel}</div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest border"
            style={{ color: accent, borderColor: `${accent}44`, backgroundColor: `${accent}0d` }}
          >
            Coming Soon
          </span>
          <Link href="/pulse" className="btn-ghost px-5 py-2.5 text-xs flex items-center gap-2">
            <ArrowLeft size={14} /> Back to Pulse
          </Link>
        </div>
      </div>
    </div>
  );
}
