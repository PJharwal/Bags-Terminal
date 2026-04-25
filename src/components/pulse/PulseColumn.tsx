"use client";

import { useRef, useEffect, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { PulseItem, PulseState } from "@/lib/types";
import { PulseCardCompact } from "./PulseCardCompact";
import { useSelectionStore } from "@/store/selection.store";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/Popover";

interface PulseColumnProps {
    state: PulseState;
    items: PulseItem[];
}

type SortOption = "age" | "mc" | "holders" | "bonding" | "volume";
type SortDirection = "asc" | "desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "age", label: "NEWEST" },
    { value: "mc", label: "MCAP" },
    { value: "holders", label: "HOLDERS" },
    { value: "bonding", label: "BONDING" },
    { value: "volume", label: "VOLUME" },
];

export function PulseColumn({ state, items }: PulseColumnProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const { selectedTokenId } = useSelectionStore();

    const [sortBy, setSortBy] = useState<SortOption>("age");
    const [sortDir, setSortDir] = useState<SortDirection>("asc");
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const processedItems = [...items].sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
            case "age":
                comparison = a.ageSeconds - b.ageSeconds;
                break;
            case "mc":
                comparison = a.marketCap - b.marketCap;
                break;
            case "holders":
                comparison = a.holders - b.holders;
                break;
            case "bonding":
                comparison = a.bondingProgress - b.bondingProgress;
                break;
            case "volume":
                comparison = (a.volume24h || 0) - (b.volume24h || 0);
                break;
        }
        return sortDir === "desc" ? -comparison : comparison;
    });

    const handleSort = (option: SortOption) => {
        if (sortBy === option) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(option);
            setSortDir("desc");
        }
        setDropdownOpen(false);
    };

    const virtualizer = useVirtualizer({
        count: processedItems.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 68,
        overscan: 8,
    });

    const virtualItems = virtualizer.getVirtualItems();

    useEffect(() => {
        if (selectedTokenId) {
            const index = processedItems.findIndex(
                (item) => item.tokenId === selectedTokenId,
            );
            if (index !== -1) {
                virtualizer.scrollToIndex(index, {
                    align: "center",
                    behavior: "smooth",
                });
            }
        }
    }, [selectedTokenId, processedItems, virtualizer]);

    const currentSortLabel =
        SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "NEWEST";

    return (
        <div className="flex flex-col h-full flex-1 relative">
            {/* Sort bar */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-[#070707]">
                <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 min-h-6 px-2 py-1 text-meta font-mono font-bold uppercase tracking-wider text-muted-high hover:text-fg transition-colors focus-ring"
                            aria-label={`Sort: ${currentSortLabel} ${sortDir}`}
                        >
                            {currentSortLabel}
                            {sortDir === "desc" ? " ↓" : " ↑"}
                            <ChevronDown
                                size={9}
                                aria-hidden="true"
                                className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                            />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" sideOffset={4} className="min-w-[120px] py-1">
                        {SORT_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleSort(opt.value)}
                                aria-pressed={sortBy === opt.value}
                                className={`w-full flex items-center justify-between px-3 py-1.5 text-meta font-mono font-bold uppercase transition-colors focus-ring ${
                                    sortBy === opt.value
                                        ? "bg-white/5 text-fg"
                                        : "text-muted-high hover:bg-white/5 hover:text-fg"
                                }`}
                            >
                                <span>{opt.label}</span>
                                {sortBy === opt.value && (
                                    <span aria-hidden="true" className="text-acid-green">
                                        {sortDir === "desc" ? "↓" : "↑"}
                                    </span>
                                )}
                            </button>
                        ))}
                    </PopoverContent>
                </Popover>

                <span className="text-meta font-mono text-muted num">
                    {processedItems.length} tokens
                </span>
            </div>

            {/* Virtual list */}
            <div
                ref={parentRef}
                className="flex-1 overflow-y-auto custom-scrollbar"
            >
                {processedItems.length > 0 ? (
                    <div
                        style={{
                            height: `${virtualizer.getTotalSize()}px`,
                            width: "100%",
                            position: "relative",
                        }}
                    >
                        {virtualItems.map((virtualItem) => {
                            const item = processedItems[virtualItem.index];
                            return (
                                <div
                                    key={virtualItem.key}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: `${virtualItem.size}px`,
                                        transform: `translateY(${virtualItem.start}px)`,
                                    }}
                                >
                                    <PulseCardCompact
                                        item={item}
                                        isSelected={
                                            selectedTokenId === item.tokenId
                                        }
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div
                        role="status"
                        className="flex flex-col items-center justify-center h-full text-white/30 font-mono text-meta uppercase tracking-widest"
                    >
                        <span aria-hidden="true" className="text-2xl mb-2">∅</span>
                        NO SIGNAL
                    </div>
                )}
            </div>
        </div>
    );
}
