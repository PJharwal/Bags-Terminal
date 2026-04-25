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
        <span className="text-acid-green font-bold font-mono tracking-tight">
          bags
          <span className="text-fg-soft">.fm</span>
        </span>
      )}
    </span>
  );
}
