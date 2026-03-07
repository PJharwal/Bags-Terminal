'use client';

import Image from 'next/image';

interface BagsLogoProps {
  size?: number;
  className?: string;
  withText?: boolean;
}

export function BagsLogo({ size = 20, className = '', withText = false }: BagsLogoProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Image
        src="/bags-logo.svg"
        alt="Bags"
        width={size}
        height={size}
        className="shrink-0"
      />
      {withText && (
        <span className="text-[#39FF14] font-bold font-mono tracking-tight">
          bags
          <span className="text-[#888]">.fm</span>
        </span>
      )}
    </span>
  );
}
