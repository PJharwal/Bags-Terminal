"use client";

import { useState } from "react";

const FILTERS = ["Clean", "Risky", "High Rep", "New"];

const TOKENS = [
    { symbol: "$PEPE", score: 92, deployer: "A+", status: "Clean", risk: "low", volume: "2.4M" },
    { symbol: "$WIF", score: 88, deployer: "A", status: "Clean", risk: "low", volume: "1.8M" },
    { symbol: "$CHAD", score: 62, deployer: "B", status: "Watch", risk: "medium", volume: "890K" },
    { symbol: "$DEGEN", score: 45, deployer: "C", status: "Caution", risk: "medium", volume: "1.2M" },
    { symbol: "$MOON", score: 29, deployer: "D", status: "Risk", risk: "high", volume: "450K" },
    { symbol: "$SHIB", score: 85, deployer: "A", status: "Clean", risk: "low", volume: "3.1M" },
];

const getRiskColor = (risk: string) => {
    switch (risk) {
        case "low": return "bg-[#2ECC71]";
        case "medium": return "bg-[#F1C40F]";
        case "high": return "bg-[#E74C3C]";
        default: return "bg-white/20";
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case "Clean": return "text-[#2ECC71]";
        case "Watch": case "Caution": return "text-[#F1C40F]";
        case "Risk": return "text-[#E74C3C]";
        default: return "text-[#9AA0A6]";
    }
};

export default function TrendingPage() {
    const [activeFilter, setActiveFilter] = useState("Clean");
    const [view, setView] = useState<"grid" | "table">("grid");

    return (
        <div className="min-h-screen bg-transparent p-6">
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-6">
                <h1 className="text-xl font-semibold mb-1">Trending BAGS Tokens</h1>
                <p className="text-sm text-[#9AA0A6]">Trending based on distribution + demand</p>
            </div>

            {/* Filters */}
            <div className="max-w-5xl mx-auto mb-6 flex items-center justify-between">
                <div className="flex gap-2">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${activeFilter === filter
                                ? "border-[#2ECC71] text-[#2ECC71] bg-[#2ECC71]/10"
                                : "border-white/10 text-[#9AA0A6] hover:border-white/20 hover:text-white"
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => setView("grid")}
                        className={`p-1.5 rounded ${view === "grid" ? "bg-white/10 text-white" : "text-[#9AA0A6]"}`}
                    >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setView("table")}
                        className={`p-1.5 rounded ${view === "table" ? "bg-white/10 text-white" : "text-[#9AA0A6]"}`}
                    >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Grid View */}
            {view === "grid" && (
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {TOKENS.map((token, i) => (
                        <div
                            key={i}
                            className="bg-[#11141B] border border-white/5 rounded-lg p-4 hover:border-white/10 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-mono font-semibold text-lg">{token.symbol}</span>
                                <span className={`w-2 h-2 rounded-full ${getRiskColor(token.risk)}`} />
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[#9AA0A6]">Score</span>
                                    <span className="font-mono font-semibold">{token.score}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#9AA0A6]">Deployer</span>
                                    <span>{token.deployer}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#9AA0A6]">Status</span>
                                    <span className={getStatusColor(token.status)}>{token.status}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#9AA0A6]">Volume</span>
                                    <span className="font-mono">${token.volume}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Table View */}
            {view === "table" && (
                <div className="max-w-5xl mx-auto bg-[#11141B] border border-white/5 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[#9AA0A6] text-xs uppercase border-b border-white/5">
                                <th className="text-left p-4">Token</th>
                                <th className="text-right p-4">Score</th>
                                <th className="text-right p-4">Deployer</th>
                                <th className="text-right p-4">Volume</th>
                                <th className="text-right p-4">Status</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {TOKENS.map((token, i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer">
                                    <td className="p-4 font-mono font-medium">{token.symbol}</td>
                                    <td className="p-4 text-right font-mono">{token.score}</td>
                                    <td className="p-4 text-right">{token.deployer}</td>
                                    <td className="p-4 text-right font-mono">${token.volume}</td>
                                    <td className={`p-4 text-right ${getStatusColor(token.status)}`}>{token.status}</td>
                                    <td className="p-4 text-right">
                                        <span className={`w-2 h-2 rounded-full inline-block ${getRiskColor(token.risk)}`} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
