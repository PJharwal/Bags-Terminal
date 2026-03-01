// Risk Heuristics
// Detection patterns for wallet behavior and token risk
// Pure functions for risk detection

import type { TokenStatsData, HolderData } from '@/types/token';

// Heuristic flags
export interface HeuristicFlag {
    type: string;
    severity: 'info' | 'warn' | 'critical';
    message: string;
    data?: Record<string, unknown>;
}

// Concentration thresholds
export const CONCENTRATION_THRESHOLDS = {
    top10Warning: 0.5,    // >50% = warning
    top10Danger: 0.7,     // >70% = danger
    devWarning: 0.1,      // >10% = warning
    devDanger: 0.2,       // >20% = danger
    insiderWarning: 0.15, // >15% = warning
    insiderDanger: 0.3,   // >30% = danger
} as const;

// Sniper detection thresholds
export const SNIPER_THRESHOLDS = {
    warning: 15,
    danger: 30,
} as const;

// Bundler detection thresholds
export const BUNDLER_THRESHOLDS = {
    warning: 50,
    danger: 100,
} as const;

/**
 * Detect concentration risk from holders
 */
export function detectConcentrationRisk(holders: HolderData[]): HeuristicFlag[] {
    const flags: HeuristicFlag[] = [];

    // Calculate top 10 concentration
    const sorted = [...holders].sort((a, b) => b.amount_percentage - a.amount_percentage);
    const top10 = sorted.slice(0, 10);
    const top10Percent = top10.reduce((sum, h) => sum + h.amount_percentage, 0);

    if (top10Percent > CONCENTRATION_THRESHOLDS.top10Danger) {
        flags.push({
            type: 'HIGH_CONCENTRATION',
            severity: 'critical',
            message: `Top 10 holders control ${(top10Percent * 100).toFixed(1)}% of supply`,
            data: { top10Percent },
        });
    } else if (top10Percent > CONCENTRATION_THRESHOLDS.top10Warning) {
        flags.push({
            type: 'MODERATE_CONCENTRATION',
            severity: 'warn',
            message: `Top 10 holders control ${(top10Percent * 100).toFixed(1)}% of supply`,
            data: { top10Percent },
        });
    }

    return flags;
}

/**
 * Detect sniper activity from stats
 */
export function detectSniperRisk(stats: TokenStatsData): HeuristicFlag[] {
    const flags: HeuristicFlag[] = [];

    if (stats.sniper_count > SNIPER_THRESHOLDS.danger) {
        flags.push({
            type: 'HIGH_SNIPER_ACTIVITY',
            severity: 'critical',
            message: `${stats.sniper_count} snipers detected`,
            data: { sniperCount: stats.sniper_count },
        });
    } else if (stats.sniper_count > SNIPER_THRESHOLDS.warning) {
        flags.push({
            type: 'SNIPER_ACTIVITY',
            severity: 'warn',
            message: `${stats.sniper_count} snipers detected`,
            data: { sniperCount: stats.sniper_count },
        });
    }

    return flags;
}

/**
 * Detect bundler activity from stats
 */
export function detectBundlerRisk(stats: TokenStatsData): HeuristicFlag[] {
    const flags: HeuristicFlag[] = [];

    if (stats.bundler_count > BUNDLER_THRESHOLDS.danger) {
        flags.push({
            type: 'HIGH_BUNDLER_ACTIVITY',
            severity: 'critical',
            message: `${stats.bundler_count} bundlers detected`,
            data: { bundlerCount: stats.bundler_count },
        });
    } else if (stats.bundler_count > BUNDLER_THRESHOLDS.warning) {
        flags.push({
            type: 'BUNDLER_ACTIVITY',
            severity: 'warn',
            message: `${stats.bundler_count} bundlers detected`,
            data: { bundlerCount: stats.bundler_count },
        });
    }

    return flags;
}

/**
 * Detect insider activity from stats
 */
export function detectInsiderRisk(stats: TokenStatsData): HeuristicFlag[] {
    const flags: HeuristicFlag[] = [];

    if (stats.insider_count > 0) {
        flags.push({
            type: 'INSIDER_DETECTED',
            severity: 'critical',
            message: `${stats.insider_count} insider wallet${stats.insider_count > 1 ? 's' : ''} detected`,
            data: { insiderCount: stats.insider_count },
        });
    }

    return flags;
}

/**
 * Detect positive signals (smart money)
 */
export function detectPositiveSignals(stats: TokenStatsData): HeuristicFlag[] {
    const flags: HeuristicFlag[] = [];

    if (stats.smart_degen_count > 5) {
        flags.push({
            type: 'SMART_MONEY_INTEREST',
            severity: 'info',
            message: `${stats.smart_degen_count} smart degens holding`,
            data: { count: stats.smart_degen_count },
        });
    }

    if (stats.bluechip_owner_count > 3) {
        flags.push({
            type: 'BLUECHIP_HOLDERS',
            severity: 'info',
            message: `${stats.bluechip_owner_count} bluechip holders`,
            data: { count: stats.bluechip_owner_count },
        });
    }

    if (stats.renowned_count > 0) {
        flags.push({
            type: 'RENOWNED_INTEREST',
            severity: 'info',
            message: `${stats.renowned_count} renowned trader${stats.renowned_count > 1 ? 's' : ''} involved`,
            data: { count: stats.renowned_count },
        });
    }

    return flags;
}

/**
 * Run all heuristics on token stats
 */
export function runAllHeuristics(stats: TokenStatsData): HeuristicFlag[] {
    return [
        ...detectSniperRisk(stats),
        ...detectBundlerRisk(stats),
        ...detectInsiderRisk(stats),
        ...detectPositiveSignals(stats),
    ];
}

/**
 * Get overall risk assessment from heuristics
 */
export function assessOverallRisk(flags: HeuristicFlag[]): 'low' | 'medium' | 'high' {
    const criticalCount = flags.filter(f => f.severity === 'critical').length;
    const warnCount = flags.filter(f => f.severity === 'warn').length;

    if (criticalCount > 0) return 'high';
    if (warnCount > 1) return 'medium';
    return 'low';
}
