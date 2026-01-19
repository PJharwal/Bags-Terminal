// Traders Data Adapter
// Transforms raw trader data for UI consumption
// PnL calculation and aggregation logic

import type { TraderData } from '@/types/token';
import { classifyWallet, getPrimaryTag, hasNegativeTags, hasPositiveTags } from '../shared/walletClassifier';

// Processed trader for UI
export interface ProcessedTrader extends TraderData {
    formattedProfit: string;
    formattedRealizedProfit: string;
    formattedUnrealizedProfit: string;
    formattedBuyVolume: string;
    formattedSellVolume: string;
    primaryTag: string | null;
    isRisky: boolean;
    isProfitable: boolean;
    roi: number;
    rank: number;
}

// Trader summary metrics
export interface TraderSummary {
    totalProfit: number;
    totalRealizedProfit: number;
    totalUnrealizedProfit: number;
    profitableCount: number;
    losingCount: number;
    averageROI: number;
    riskyTraderCount: number;
}

/**
 * Format currency for display
 */
function formatCurrency(value: number): string {
    const prefix = value >= 0 ? '+' : '';
    return prefix + new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Format currency without sign prefix for volume
 */
function formatVolume(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Calculate ROI (Return on Investment)
 */
export function calculateROI(profit: number, totalCost: number): number {
    if (totalCost <= 0) return 0;
    return (profit / totalCost) * 100;
}

/**
 * Process raw trader data for UI
 */
export function adaptTrader(trader: TraderData, rank: number): ProcessedTrader {
    const roi = calculateROI(trader.profit, trader.total_cost);

    return {
        ...trader,
        formattedProfit: formatCurrency(trader.profit),
        formattedRealizedProfit: formatCurrency(trader.realized_profit),
        formattedUnrealizedProfit: formatCurrency(trader.unrealized_profit),
        formattedBuyVolume: formatVolume(trader.buy_volume_cur),
        formattedSellVolume: formatVolume(trader.sell_volume_cur),
        primaryTag: getPrimaryTag(trader.maker_token_tags) || trader.wallet_tag_v2 || null,
        isRisky: hasNegativeTags(trader.maker_token_tags) || trader.is_suspicious,
        isProfitable: trader.profit > 0,
        roi,
        rank,
    };
}

/**
 * Process array of traders
 */
export function adaptTraders(traders: TraderData[]): ProcessedTrader[] {
    return traders.map((trader, index) => adaptTrader(trader, index + 1));
}

/**
 * Sort traders by PnL (descending - most profitable first)
 */
export function sortByPnL(traders: TraderData[]): TraderData[] {
    return [...traders].sort((a, b) => b.profit - a.profit);
}

/**
 * Sort traders by realized profit
 */
export function sortByRealizedProfit(traders: TraderData[]): TraderData[] {
    return [...traders].sort((a, b) => b.realized_profit - a.realized_profit);
}

/**
 * Sort traders by volume
 */
export function sortByVolume(traders: TraderData[]): TraderData[] {
    return [...traders].sort((a, b) =>
        (b.buy_volume_cur + b.sell_volume_cur) - (a.buy_volume_cur + a.sell_volume_cur)
    );
}

/**
 * Calculate trader summary metrics
 */
export function calculateTraderSummary(traders: TraderData[]): TraderSummary {
    let totalProfit = 0;
    let totalRealizedProfit = 0;
    let totalUnrealizedProfit = 0;
    let profitableCount = 0;
    let losingCount = 0;
    let totalROI = 0;
    let riskyTraderCount = 0;

    for (const trader of traders) {
        totalProfit += trader.profit;
        totalRealizedProfit += trader.realized_profit;
        totalUnrealizedProfit += trader.unrealized_profit;

        if (trader.profit > 0) profitableCount++;
        else if (trader.profit < 0) losingCount++;

        totalROI += calculateROI(trader.profit, trader.total_cost);

        if (hasNegativeTags(trader.maker_token_tags) || trader.is_suspicious) {
            riskyTraderCount++;
        }
    }

    return {
        totalProfit,
        totalRealizedProfit,
        totalUnrealizedProfit,
        profitableCount,
        losingCount,
        averageROI: traders.length > 0 ? totalROI / traders.length : 0,
        riskyTraderCount,
    };
}

/**
 * Get profitable traders only
 */
export function getProfitableTraders(traders: TraderData[]): TraderData[] {
    return traders.filter(t => t.profit > 0);
}

/**
 * Get losing traders
 */
export function getLosingTraders(traders: TraderData[]): TraderData[] {
    return traders.filter(t => t.profit < 0);
}

/**
 * Get smart money traders (positive tags + profitable)
 */
export function getSmartMoneyTraders(traders: TraderData[]): TraderData[] {
    return traders.filter(t =>
        hasPositiveTags(t.maker_token_tags) && t.profit > 0
    );
}

/**
 * Get suspicious traders
 */
export function getSuspiciousTraders(traders: TraderData[]): TraderData[] {
    return traders.filter(t =>
        hasNegativeTags(t.maker_token_tags) || t.is_suspicious
    );
}
