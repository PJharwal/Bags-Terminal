"use client";

import type { CredibilityMatrix as CredibilityMatrixType, PatternFlag } from "@/lib/types";
import { useTerminalStore } from "@/store/terminal.store";
import {
    Shield,
    AlertTriangle,
    Info,
    TrendingUp,
    TrendingDown,
    Minus,
    Wallet,
    Users,
    CircleDollarSign
} from "lucide-react";

interface CredibilityMatrixProps {
    tokenId?: string;
    layout: 'terminal' | 'pulse';
    matrix?: CredibilityMatrixType | null;
}

// Get color based on grade
function getGradeColor(grade: string): string {
    if (grade.startsWith('A')) return '#39FF14';
    if (grade.startsWith('B')) return '#00F0FF';
    if (grade.startsWith('C')) return '#FFD700';
    if (grade === 'D') return '#FF8C00';
    return '#FF003C';
}

// Get severity styling
function getSeverityStyle(severity: 'info' | 'warn' | 'critical') {
    switch (severity) {
        case 'info': return { color: '#39FF14', icon: Info, prefix: 'ℹ' };
        case 'warn': return { color: '#FFD700', icon: AlertTriangle, prefix: '⚠' };
        case 'critical': return { color: '#FF003C', icon: AlertTriangle, prefix: '⛔' };
    }
}

// Get trend icon
function TrendIcon({ trend }: { trend: 'Improving' | 'Stable' | 'Deteriorating' }) {
    if (trend === 'Improving') return <TrendingUp size={12} className="text-[#39FF14]" />;
    if (trend === 'Deteriorating') return <TrendingDown size={12} className="text-[#FF003C]" />;
    return <Minus size={12} className="text-[#888]" />;
}

// Pattern Flag Row
function PatternRow({ pattern }: { pattern: PatternFlag }) {
    const style = getSeverityStyle(pattern.severity);

    return (
        <div
            className="flex items-start gap-2 py-1 group cursor-help"
            title={pattern.explanation}
        >
            <span style={{ color: style.color }} className="text-xs mt-0.5">
                {style.prefix}
            </span>
            <span className="text-[10px] text-[#AAAAAA] group-hover:text-[#EDEDED] transition-colors">
                {pattern.explanation}
            </span>
        </div>
    );
}

// Score Row for Terminal layout
function ScoreRow({
    label,
    grade,
    scoreLabel,
    summary,
    icon: Icon
}: {
    label: string;
    grade: string;
    scoreLabel: string;
    summary: string;
    icon: React.ElementType;
}) {
    const color = getGradeColor(grade);

    return (
        <div className="flex items-start gap-3 py-2">
            <Icon size={14} className="text-[#666] mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-[#888] uppercase tracking-wider">{label}</span>
                    <div className="flex items-center gap-2">
                        <span
                            className="text-xs font-bold font-mono"
                            style={{ color }}
                        >
                            {grade}
                        </span>
                        <span className="text-[10px] text-[#666]">{scoreLabel}</span>
                    </div>
                </div>
                <p className="text-[10px] text-[#AAAAAA]">{summary}</p>
            </div>
        </div>
    );
}

export function CredibilityMatrix({ layout, matrix: externalMatrix }: CredibilityMatrixProps) {
    const storeMatrix = useTerminalStore(state => state.credibilityMatrix);
    const matrix = externalMatrix ?? storeMatrix;

    if (!matrix) {
        return (
            <div className={`${layout === 'terminal' ? 'p-4' : 'p-3'} card`}>
                <div className="flex items-center gap-2 text-[#555] text-xs">
                    <Shield size={14} />
                    <span className="font-mono uppercase tracking-wider">Loading credibility...</span>
                </div>
            </div>
        );
    }

    // Compact Pulse layout
    if (layout === 'pulse') {
        const topPatterns = matrix.behaviorPatterns.slice(0, 3);
        const gradeColor = getGradeColor(matrix.overallGrade);

        return (
            <div className="card p-3">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Shield size={12} className="text-[#555]" />
                        <span className="label">Credibility</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className="text-sm font-bold font-mono"
                            style={{ color: gradeColor }}
                        >
                            {matrix.overallGrade}
                        </span>
                        <span className="text-[10px] text-[#666] font-mono">
                            {matrix.confidenceBand.range[0]}–{matrix.confidenceBand.range[1]}
                        </span>
                    </div>
                </div>

                {/* Key Patterns */}
                <div className="space-y-0.5">
                    {topPatterns.map((pattern, idx) => (
                        <PatternRow key={idx} pattern={pattern} />
                    ))}
                </div>
            </div>
        );
    }

    // Full Terminal layout
    return (
        <div className="card">
            {matrix?.dataSource === 'synthetic' && (
                <div className="text-xs text-yellow-500/70 border border-yellow-500/20 bg-yellow-500/5 px-3 py-1.5 mb-3 font-mono">
                    Credibility data unavailable — showing estimated scores
                </div>
            )}
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                    <Shield size={14} className="text-[#39FF14]" />
                    <span className="text-xs font-bold text-[#EDEDED] uppercase tracking-wider">
                        Credibility
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span
                        className="text-lg font-bold font-mono"
                        style={{ color: getGradeColor(matrix.overallGrade) }}
                    >
                        {matrix.overallGrade}
                    </span>
                    <span className="text-[10px] text-[#666] font-mono">
                        {matrix.overallScore}
                    </span>
                </div>
            </div>

            {/* Scores Section */}
            <div className="px-4 py-2 border-b border-white/10">
                <ScoreRow
                    icon={Wallet}
                    label="Deployer"
                    grade={matrix.deployer.grade}
                    scoreLabel={matrix.deployer.label}
                    summary={matrix.deployer.summary}
                />
                <ScoreRow
                    icon={CircleDollarSign}
                    label="Funding"
                    grade={matrix.funding.grade}
                    scoreLabel={matrix.funding.label}
                    summary={matrix.funding.summary}
                />
                <ScoreRow
                    icon={Users}
                    label="Distribution"
                    grade={matrix.distribution.grade}
                    scoreLabel={matrix.distribution.label}
                    summary={matrix.distribution.summary}
                />
            </div>

            {/* Confidence Band */}
            <div className="px-4 py-2 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <span className="label">Confidence Band</span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#EDEDED]">
                            {matrix.confidenceBand.range[0]} – {matrix.confidenceBand.range[1]}
                        </span>
                        <TrendIcon trend={matrix.confidenceBand.trend} />
                        <span className="text-[10px] text-[#666]">{matrix.confidenceBand.trend}</span>
                    </div>
                </div>
            </div>

            {/* Patterns Section */}
            <div className="px-4 py-2">
                <div className="label mb-2">Patterns</div>
                <div className="space-y-0.5">
                    {matrix.behaviorPatterns.length > 0 ? (
                        matrix.behaviorPatterns.map((pattern, idx) => (
                            <PatternRow key={idx} pattern={pattern} />
                        ))
                    ) : (
                        <div className="text-[10px] text-[#444] py-1">No significant patterns detected</div>
                    )}
                </div>
            </div>
        </div>
    );
}
