// Token Audit Engine
// Pure functions for risk analysis - extracted from omnera-frontend-main
// No React, no UI, deterministic outputs

import type { TokenStatsData } from '@/types/token';

// Risk level classification
export type RiskLevel = 'safe' | 'warning' | 'danger' | 'neutral';

// Stat item with computed risk
export interface StatItem {
    key: string;
    label: string;
    value: number;
    risk: RiskLevel;
}

// Audit result
export interface TokenAuditResult {
    score: number;
    riskLevel: 'low' | 'medium' | 'high';
    breakdown: StatItem[];
    dangerCount: number;
    warningCount: number;
    safeCount: number;
}

/**
 * Classify risk level for a specific stat
 * Extracted from omnera TokenAudit.tsx
 */
export function getRiskLevel(key: string, value: number): RiskLevel {
    switch (key) {
        case 'bundler_count':
            if (value > 100) return 'danger';
            if (value > 50) return 'warning';
            return 'safe';
        case 'sniper_count':
            if (value > 30) return 'danger';
            if (value > 15) return 'warning';
            return 'safe';
        case 'fresh_wallet_count':
            if (value > 50) return 'warning';
            return 'neutral';
        case 'insider_count':
            if (value > 0) return 'danger';
            return 'safe';
        case 'smart_degen_count':
        case 'renowned_count':
        case 'bluechip_owner_count':
            return value > 0 ? 'safe' : 'neutral';
        case 'dex_bot_count':
            if (value > 20) return 'warning';
            return 'neutral';
        case 'dev_count':
            if (value > 5) return 'warning';
            return 'neutral';
        default:
            return 'neutral';
    }
}

/**
 * Get human-readable label for stat key
 */
export function getStatLabel(key: string): string {
    const labels: Record<string, string> = {
        smart_degen_count: 'Smart Degens',
        renowned_count: 'Renowned',
        bluechip_owner_count: 'Bluechip',
        fresh_wallet_count: 'Fresh Wallets',
        dex_bot_count: 'DEX Bots',
        insider_count: 'Insiders',
        following_count: 'Following',
        dev_count: 'Devs',
        bundler_count: 'Bundlers',
        sniper_count: 'Snipers',
    };
    return labels[key] || key.replace(/_/g, ' ');
}

/**
 * Compute composite token audit score
 * Logic extracted from omnera TokenAudit.tsx
 * 
 * Score calculation:
 * - Base: 100
 * - Each danger: -30 (min 10)
 * - Each warning: -10 (when danger exists) or -15 (when no danger, min 50)
 */
export function computeTokenAuditScore(stats: TokenStatsData): number {
    const statItems = getStatBreakdown(stats);

    const dangerCount = statItems.filter(s => s.risk === 'danger').length;
    const warningCount = statItems.filter(s => s.risk === 'warning').length;

    let score = 100;

    if (dangerCount > 0) {
        score = Math.max(10, 100 - (dangerCount * 30) - (warningCount * 10));
    } else if (warningCount > 0) {
        score = Math.max(50, 100 - (warningCount * 15));
    }

    return score;
}

/**
 * Get stat breakdown with risk levels
 */
export function getStatBreakdown(stats: TokenStatsData): StatItem[] {
    const keys: (keyof TokenStatsData)[] = [
        'smart_degen_count',
        'renowned_count',
        'bluechip_owner_count',
        'fresh_wallet_count',
        'dex_bot_count',
        'insider_count',
        'dev_count',
        'bundler_count',
        'sniper_count',
    ];

    return keys.map(key => ({
        key,
        label: getStatLabel(key),
        value: stats[key] || 0,
        risk: getRiskLevel(key, stats[key] || 0),
    }));
}

/**
 * Full token audit computation
 */
export function computeTokenAudit(stats: TokenStatsData): TokenAuditResult {
    const breakdown = getStatBreakdown(stats);
    const score = computeTokenAuditScore(stats);

    const dangerCount = breakdown.filter(s => s.risk === 'danger').length;
    const warningCount = breakdown.filter(s => s.risk === 'warning').length;
    const safeCount = breakdown.filter(s => s.risk === 'safe').length;

    let riskLevel: 'low' | 'medium' | 'high';
    if (score >= 70) riskLevel = 'low';
    else if (score >= 40) riskLevel = 'medium';
    else riskLevel = 'high';

    return {
        score,
        riskLevel,
        breakdown,
        dangerCount,
        warningCount,
        safeCount,
    };
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): string {
    if (score >= 70) return '#39FF14'; // Green
    if (score >= 40) return '#FAFF00'; // Yellow
    return '#FF003C'; // Red
}

/**
 * Get risk color for UI
 */
export function getRiskColor(risk: RiskLevel): string {
    const colors: Record<RiskLevel, string> = {
        safe: '#39FF14',
        warning: '#FAFF00',
        danger: '#FF003C',
        neutral: '#444444',
    };
    return colors[risk];
}
