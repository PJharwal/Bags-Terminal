"use client";

import { useRef, useEffect, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { PulseItem, PulseState } from "@/lib/types";
import { PulseCardCompact } from "./PulseCardCompact";
import { useSelectionStore } from "@/store/selection.store";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

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
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-[#666] hover:text-[#EDEDED] transition-colors"
                    >
                        {currentSortLabel}
                        {sortDir === "desc" ? " ↓" : " ↑"}
                        <ChevronDown
                            size={9}
                            className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                        />
                    </button>

                    <AnimatePresence>
                        {dropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setDropdownOpen(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.1 }}
                                    className="absolute top-full left-0 mt-1 z-50 min-w-[120px] bg-[#0A0A0A] border border-white/10 shadow-2xl"
                                >
                                    {SORT_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() =>
                                                handleSort(opt.value)
                                            }
                                            className={`w-full flex items-center justify-between px-3 py-1.5 text-[9px] font-mono font-bold uppercase transition-colors ${
                                                sortBy === opt.value
                                                    ? "bg-white/5 text-[#EDEDED]"
                                                    : "text-[#666] hover:bg-white/3 hover:text-[#EDEDED]"
                                            }`}
                                        >
                                            <span>{opt.label}</span>
                                            {sortBy === opt.value && (
                                                <span className="text-[#39FF14]">
                                                    {sortDir === "desc"
                                                        ? "↓"
                                                        : "↑"}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                <span className="text-[9px] font-mono text-[#444]">
                    {processedItems.length} tokens
                </span>
            </div>

            {/* Virtual list */}
            <div
                ref={parentRef}
                className="flex-1 overflow-y-auto custom-scrollbar relative"
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
                            // Stagger only top-of-viewport items
                            const animate = virtualItem.index < 10;
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
                                    {/* Animation lives on an inner node so its transform
                                        keyframe does not clobber the virtualizer's
                                        positioning translateY on the wrapper. */}
                                    <div
                                        className={animate ? "slide-in-top" : ""}
                                        style={{
                                            animationDelay: animate
                                                ? `${virtualItem.index * 40}ms`
                                                : undefined,
                                        }}
                                    >
                                        <PulseCardCompact
                                            item={item}
                                            isSelected={
                                                selectedTokenId === item.tokenId
                                            }
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="scan-line flex flex-col items-center justify-center h-full gap-2">
                        <div className="text-[#333] font-mono text-[10px] uppercase tracking-[0.2em]">
                            NO SIGNAL
                        </div>
                        <div className="text-[#222] font-mono text-[8px] tracking-widest">
                            WAITING…
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
