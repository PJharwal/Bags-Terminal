"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePulseStore } from "@/store/pulse.store";
import { useSelectionStore } from "@/store/selection.store";
import { formatCurrency, formatNumber } from "@/lib/format";
import { formatAge } from "@/lib/lifecycle";
import { generateCredibilityMatrix } from "@/lib/credibility";
import { CredibilityMatrix } from "@/components/credibility/CredibilityMatrix";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield,
    AlertTriangle,
    Terminal,
    X,
    ExternalLink,
    Copy,
    Activity,
    Check,
    Zap,
} from "lucide-react";
import { useState } from "react";

function StatBlock({
    label,
    value,
    color = "text-fg",
}: {
    label: string;
    value: string | number;
    color?: string;
}) {
    return (
        <div className="p-3 bg-[#0A0A0A] border border-white/5 hover:border-white/10 transition-colors">
            <div className="text-meta text-muted-mid uppercase tracking-widest mb-1 font-mono">
                {label}
            </div>
            <div className={`text-sm font-bold font-mono ${color}`}>
                {value}
            </div>
        </div>
    );
}

export function PulseDrawer() {
    const { selectedTokenId, drawerOpen, drawerSource, closeDrawer } =
        useSelectionStore();
    const { getItemById } = usePulseStore();
    const router = useRouter();
    const [copied, setCopied] = useState(false);

    const item = selectedTokenId ? getItemById(selectedTokenId) : null;

    const credibilityMatrix = useMemo(() => {
        if (!selectedTokenId) return null;
        return generateCredibilityMatrix(selectedTokenId);
    }, [selectedTokenId]);

    if (!drawerOpen || !item || drawerSource !== "pulse") return null;

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(item.tokenId);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleOpenTerminal = () => {
        router.push(`/terminal/${item.tokenId}`);
    };

    const bondingColor =
        item.bondingProgress >= 90
            ? "#39FF14"
            : item.bondingProgress >= 70
              ? "#FFD700"
              : "#00F0FF";

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed top-14 right-0 h-[calc(100vh-56px)] w-[400px] bg-[#080808] border-l border-white/5 z-50 flex flex-col font-mono shadow-2xl"
            >
                {/* Header */}
                <div className="p-5 border-b border-white/5 bg-[#0A0A0A]">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            {/* Token image */}
                            <div className="w-10 h-10 bg-[#111] border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {item.logoUrl ? (
                                    <img
                                        src={item.logoUrl}
                                        alt={item.symbol}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-xs font-bold text-muted-mid">
                                        {item.symbol
                                            .replace("$", "")
                                            .slice(0, 2)}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-fg">
                                    {item.symbol}
                                </h2>
                                <div className="text-meta text-muted-high">
                                    {item.name}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={closeDrawer}
                            className="p-1.5 text-muted-high hover:text-fg hover:bg-white/5 transition-all"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 text-meta text-fg-soft">
                        <span className="flex items-center gap-1">
                            <Activity size={10} />{" "}
                            {formatAge(item.ageSeconds)}
                        </span>
                        <div className="w-px h-3 bg-white/10" />
                        <span className="num" style={{ color: bondingColor }}>
                            {Math.round(item.bondingProgress)}% BONDED
                        </span>
                        <div className="w-px h-3 bg-white/10" />
                        <span className="text-muted-high">
                            {item.state.replace("_", " ")}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                    {/* Key Stats */}
                    <div className="grid grid-cols-2 gap-2">
                        <StatBlock
                            label="MARKET CAP"
                            value={formatCurrency(item.marketCap)}
                            color="text-acid-green"
                        />
                        <StatBlock
                            label="LIQUIDITY"
                            value={formatCurrency(item.liquidity)}
                        />
                        <StatBlock
                            label="HOLDERS"
                            value={formatNumber(item.holders)}
                        />
                        <StatBlock
                            label="VOL 24H"
                            value={formatCurrency(item.volume24h || 0)}
                        />
                    </div>

                    {/* Bonding Curve */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-meta font-bold uppercase tracking-widest text-muted-high">
                                BONDING CURVE
                            </span>
                            <span
                                className="text-xs font-bold font-mono num"
                                style={{ color: bondingColor }}
                            >
                                {Math.round(item.bondingProgress)}%
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-[#111] overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                    width: `${item.bondingProgress}%`,
                                }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="h-full"
                                style={{
                                    backgroundColor: bondingColor,
                                    boxShadow: `0 0 8px ${bondingColor}40`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Risk Assessment */}
                    <div>
                        <h3 className="text-meta font-bold uppercase tracking-widest text-muted-high mb-2 flex items-center gap-1.5">
                            <Shield size={10} /> RISK
                        </h3>
                        {item.riskFlags.length > 0 ? (
                            <div className="space-y-1.5">
                                {item.riskFlags.map((flag, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center gap-2 p-2.5 text-xs font-bold uppercase ${
                                            flag.severity === "critical"
                                                ? "bg-[#FF003C]/8 border border-[#FF003C]/20 text-error"
                                                : "bg-[#FFD700]/8 border border-[#FFD700]/20 text-gold"
                                        }`}
                                    >
                                        <AlertTriangle size={12} />
                                        <span className="text-meta">
                                            {flag.type.replace(/_/g, " ")}
                                        </span>
                                        <span className="ml-auto text-meta opacity-60">
                                            {flag.severity}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-2.5 bg-acid-green/5 border border-[#39FF14]/15 text-acid-green flex items-center gap-2">
                                <Shield size={12} />
                                <span className="text-meta font-bold uppercase">
                                    NO RISKS DETECTED
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Credibility Matrix */}
                    {credibilityMatrix && (
                        <CredibilityMatrix
                            tokenId={selectedTokenId ?? undefined}
                            layout="pulse"
                            matrix={credibilityMatrix}
                        />
                    )}

                    {/* Deployer Info */}
                    <div>
                        <h3 className="text-meta font-bold uppercase tracking-widest text-muted-high mb-2 flex items-center gap-1.5">
                            <Terminal size={10} /> DEPLOYER
                        </h3>
                        <div className="p-3 bg-[#0A0A0A] border border-white/5 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-meta text-muted-mid">
                                    ADDRESS
                                </span>
                                <div className="flex items-center gap-2 text-meta font-mono text-fg">
                                    {item.tokenId.slice(0, 6)}...
                                    {item.tokenId.slice(-4)}
                                    <button
                                        onClick={handleCopyAddress}
                                        className="text-muted-high hover:text-fg transition-colors"
                                    >
                                        {copied ? (
                                            <Check
                                                size={10}
                                                className="text-acid-green"
                                            />
                                        ) : (
                                            <Copy size={10} />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-meta text-muted-mid">
                                    LAUNCHES
                                </span>
                                <span className="text-meta font-mono text-fg">
                                    {item.deployerLaunches || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 bg-[#0A0A0A] space-y-3">
                    <button
                        onClick={() => {
                            router.push(`/terminal/${item.tokenId}?action=buy`);
                            closeDrawer();
                        }}
                        className="w-full py-3 bg-acid-green text-black font-bold uppercase tracking-wider hover:bg-[#32E010] transition-colors flex items-center justify-center gap-2"
                    >
                        <Zap size={16} /> OPEN_TERMINAL
                    </button>
                    <a
                        href={`https://solscan.io/token/${item.tokenId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-transparent border border-white/10 text-fg-soft font-bold uppercase tracking-wider hover:border-white/30 hover:text-fg transition-colors flex items-center justify-center gap-2"
                    >
                        <ExternalLink size={16} /> VIEW_ON_SOLSCAN
                    </a>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
