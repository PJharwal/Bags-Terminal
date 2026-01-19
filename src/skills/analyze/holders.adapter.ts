// Holders Data Adapter
// Transforms raw holder data for UI consumption
// Pure functions for data shaping

import type { HolderData } from '@/types/token';
import { classifyWallet, getPrimaryTag, hasNegativeTags } from '../shared/walletClassifier';

// Processed holder for UI
export interface ProcessedHolder extends HolderData {
    formattedBalance: string;
    formattedValue: string;
    formattedPercent: string;
    primaryTag: string | null;
    isRisky: boolean;
    rank: number;
}

// Holder concentration metrics
export interface HolderConcentration {
    top10Percent: number;
    top20Percent: number;
    devPercent: number;
    insiderPercent: number;
    isConcentrated: boolean;
}

/**
 * Format large numbers for display
 */
export function formatNumber(num: number): string {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
    return num.toLocaleString();
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
    return (value * 100).toFixed(2) + '%';
}

/**
 * Process raw holder data for UI
 */
export function adaptHolder(holder: HolderData, rank: number): ProcessedHolder {
    return {
        ...holder,
        formattedBalance: formatNumber(holder.balance),
        formattedValue: formatCurrency(holder.usd_value),
        formattedPercent: formatPercent(holder.amount_percentage),
        primaryTag: getPrimaryTag(holder.maker_token_tags) || holder.wallet_tag_v2 || null,
        isRisky: hasNegativeTags(holder.maker_token_tags) || holder.is_suspicious,
        rank,
    };
}

/**
 * Process array of holders
 */
export function adaptHolders(holders: HolderData[]): ProcessedHolder[] {
    return holders.map((holder, index) => adaptHolder(holder, index + 1));
}

/**
 * Sort holders by USD value (descending)
 */
export function sortHoldersByValue(holders: HolderData[]): HolderData[] {
    return [...holders].sort((a, b) => b.usd_value - a.usd_value);
}

/**
 * Sort holders by percentage (descending)
 */
export function sortHoldersByPercent(holders: HolderData[]): HolderData[] {
    return [...holders].sort((a, b) => b.amount_percentage - a.amount_percentage);
}

/**
 * Calculate holder concentration metrics
 */
export function calculateConcentration(holders: HolderData[]): HolderConcentration {
    const sorted = sortHoldersByPercent(holders);

    // Top 10 concentration
    const top10 = sorted.slice(0, 10);
    const top10Percent = top10.reduce((sum, h) => sum + h.amount_percentage, 0);

    // Top 20 concentration
    const top20 = sorted.slice(0, 20);
    const top20Percent = top20.reduce((sum, h) => sum + h.amount_percentage, 0);

    // Dev wallet concentration
    const devWallets = holders.filter(h =>
        h.wallet_tag_v2?.toLowerCase().includes('dev') ||
        h.maker_token_tags.some(t => t.toLowerCase().includes('dev'))
    );
    const devPercent = devWallets.reduce((sum, h) => sum + h.amount_percentage, 0);

    // Insider concentration
    const insiderWallets = holders.filter(h =>
        h.maker_token_tags.some(t =>
            t.toLowerCase().includes('insider') ||
            t.toLowerCase().includes('sniper') ||
            t.toLowerCase().includes('bundler')
        )
    );
    const insiderPercent = insiderWallets.reduce((sum, h) => sum + h.amount_percentage, 0);

    return {
        top10Percent,
        top20Percent,
        devPercent,
        insiderPercent,
        isConcentrated: top10Percent > 0.5, // >50% is concentrated
    };
}

/**
 * Filter holders by tag type
 */
export function filterHoldersByTag(holders: HolderData[], tag: string): HolderData[] {
    return holders.filter(h =>
        h.wallet_tag_v2?.toLowerCase().includes(tag.toLowerCase()) ||
        h.maker_token_tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
    );
}

/**
 * Get risky holders
 */
export function getRiskyHolders(holders: HolderData[]): HolderData[] {
    return holders.filter(h =>
        hasNegativeTags(h.maker_token_tags) || h.is_suspicious
    );
}
