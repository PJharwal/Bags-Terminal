"use client";

import { useRef, useEffect, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { PulseItem, PulseState } from "@/lib/types";
import { PulseCardCompact } from "./PulseCardCompact";
import { useSelectionStore } from "@/store/selection.store";
import { getStateConfig } from "@/lib/lifecycle";
import { motion, AnimatePresence } from "framer-motion";
import { SortAsc, SortDesc, Filter, CheckSquare, Square } from "lucide-react";

interface PulseColumnProps {
    state: PulseState;
    items: PulseItem[];
}

type SortOption = 'age' | 'mc' | 'holders' | 'bonding' | 'volume';
type SortDirection = 'asc' | 'desc';

// Column-level sort/filter dropdown
function ColumnSortDropdown({
    sortBy,
    sortDir,
    onSort
}: {
    sortBy: SortOption;
    sortDir: SortDirection;
    onSort: (option: SortOption) => void;
}) {
    const [open, setOpen] = useState(false);

    const options: { value: SortOption; label: string }[] = [
        { value: 'age', label: 'AGE' },
        { value: 'mc', label: 'MKT_CAP' },
        { value: 'holders', label: 'HOLDERS' },
        { value: 'bonding', label: 'BONDING' },
        { value: 'volume', label: 'VOLUME' },
    ];

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#666] hover:text-[#EDEDED] border border-transparent hover:border-[#333] transition-all"
            >
                {sortBy.toUpperCase()}
                {sortDir === 'desc' ? <SortDesc size={10} /> : <SortAsc size={10} />}
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.1 }}
                            className="absolute top-full left-0 mt-1 z-50 min-w-[140px] bg-[#050505] border border-white/10 shadow-xl"
                        >
                            <div className="flex flex-col">
                                {options.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => {
                                            onSort(opt.value);
                                            setOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2 text-[10px] font-mono font-bold uppercase transition-colors ${sortBy === opt.value
                                                ? 'bg-[#39FF14] text-black'
                                                : 'text-[#888] hover:bg-white/5 hover:text-[#EDEDED]'
                                            }`}
                                    >
                                        <span>{opt.label}</span>
                                        {sortBy === opt.value && (
                                            <span>{sortDir === 'desc' ? '↓' : '↑'}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export function PulseColumn({ state, items }: PulseColumnProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const { selectedTokenId } = useSelectionStore();
    const config = getStateConfig(state);

    const [sortBy, setSortBy] = useState<SortOption>('age');
    const [sortDir, setSortDir] = useState<SortDirection>('asc');
    const [hideWarn, setHideWarn] = useState(false);

    // Sort and filter
    const processedItems = [...items]
        .filter(item => !hideWarn || !item.riskFlags.some(f => f.severity === 'warn'))
        .sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'age': comparison = a.ageSeconds - b.ageSeconds; break;
                case 'mc': comparison = a.marketCap - b.marketCap; break;
                case 'holders': comparison = a.holders - b.holders; break;
                case 'bonding': comparison = a.bondingProgress - b.bondingProgress; break;
                case 'volume': comparison = (a.volume24h || 0) - (b.volume24h || 0); break;
            }
            return sortDir === 'desc' ? -comparison : comparison;
        });

    const handleSort = (option: SortOption) => {
        if (sortBy === option) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(option);
            setSortDir('desc');
        }
    };

    const virtualizer = useVirtualizer({
        count: processedItems.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 80, // Compact height
        overscan: 5,
    });

    const virtualItems = virtualizer.getVirtualItems();

    useEffect(() => {
        if (selectedTokenId) {
            const index = processedItems.findIndex(item => item.tokenId === selectedTokenId);
            if (index !== -1) {
                virtualizer.scrollToIndex(index, { align: 'center', behavior: 'smooth' });
            }
        }
    }, [selectedTokenId, processedItems, virtualizer]);

    return (
        <div className="flex flex-col h-full min-w-[300px] flex-1 relative border-r border-white/5 last:border-r-0">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-[#0A0A0A]">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#666]">SORT:</span>
                    <ColumnSortDropdown sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                </div>
                <button
                    onClick={() => setHideWarn(!hideWarn)}
                    className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono font-bold uppercase transition-colors ${hideWarn ? 'text-[#FF003C]' : 'text-[#666] hover:text-[#EDEDED]'}`}
                >
                    {hideWarn ? <CheckSquare size={10} /> : <Square size={10} />}
                    HIDE_RISK
                </button>
            </div>

            {/* List */}
            <div
                ref={parentRef}
                className="h-full overflow-y-auto custom-scrollbar relative bg-[#050505]"
            >
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none fixed" />
                
                {processedItems.length > 0 ? (
                    <div
                        style={{
                            height: `${virtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {virtualItems.map((virtualItem) => {
                            const item = processedItems[virtualItem.index];
                            return (
                                <div
                                    key={virtualItem.key}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: `${virtualItem.size}px`,
                                        transform: `translateY(${virtualItem.start}px)`,
                                    }}
                                >
                                    <PulseCardCompact
                                        item={item}
                                        isSelected={selectedTokenId === item.tokenId}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-[#333] font-mono text-[10px] uppercase tracking-widest">
                        NO_SIGNAL
                    </div>
                )}
            </div>
        </div>
    );
}