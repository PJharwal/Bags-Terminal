'use client';

import Image from 'next/image';
import { Tooltip } from '@/components/atoms';
import { useChain } from '@/hooks';

interface ChainSelectorProps {
    variant?: 'desktop' | 'mobile';
}

export function ChainSelector({ variant = 'desktop' }: ChainSelectorProps) {
    const { activeChain, changeChain } = useChain();

    if (variant === 'mobile') {
        return (
            <div className="relative flex items-center gap-0.5 shrink-0">
                <Tooltip content="Solana" position="right">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#16161e] border border-[#2a2a38]">
                        <Image src="/icons/sol-fill.svg" alt="Solana" width={15} height={15} />
                    </div>
                </Tooltip>
            </div>
        );
    }

    // desktop variant
    return (
        <div className="flex items-center gap-1 p-1">
            <Tooltip content="Solana">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#16181f]">
                    <Image src="/icons/sol-fill.svg" alt="Solana" width={16} height={16} />
                </div>
            </Tooltip>
        </div>
    );
}

