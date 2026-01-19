// Wallet Classifier Engine
// Shared logic for wallet tagging and classification
// Used by HoldersTable, TradersTable, and CredibilityMatrix

import type { HolderData, TraderData } from '@/types/token';

// Wallet tag types (from omnera)
export type WalletTag =
    | 'sniper'
    | 'bundler'
    | 'dev'
    | 'insider'
    | 'whale'
    | 'smart_degen'
    | 'bluechip'
    | 'fresh'
    | 'dex_bot'
    | 'renowned';

// Tag severity for UI coloring
export type TagSeverity = 'positive' | 'neutral' | 'negative';

export interface WalletTagInfo {
    tag: WalletTag;
    label: string;
    severity: TagSeverity;
    description: string;
}

// Tag metadata
const TAG_INFO: Record<WalletTag, Omit<WalletTagInfo, 'tag'>> = {
    sniper: {
        label: 'Sniper',
        severity: 'negative',
        description: 'Bot that buys tokens within blocks of launch',
    },
    bundler: {
        label: 'Bundler',
        severity: 'negative',
        description: 'Wallet that bundles transactions for MEV',
    },
    dev: {
        label: 'Dev',
        severity: 'neutral',
        description: 'Token developer wallet',
    },
    insider: {
        label: 'Insider',
        severity: 'negative',
        description: 'Connected to developer or early access',
    },
    whale: {
        label: 'Whale',
        severity: 'neutral',
        description: 'Large holder (>5% supply)',
    },
    smart_degen: {
        label: 'Smart Degen',
        severity: 'positive',
        description: 'Profitable trader with good track record',
    },
    bluechip: {
        label: 'Bluechip',
        severity: 'positive',
        description: 'Holds established tokens (>$1M marketcap)',
    },
    fresh: {
        label: 'Fresh',
        severity: 'neutral',
        description: 'Recently created wallet',
    },
    dex_bot: {
        label: 'DEX Bot',
        severity: 'neutral',
        description: 'Automated trading bot',
    },
    renowned: {
        label: 'Renowned',
        severity: 'positive',
        description: 'Well-known trader or influencer',
    },
};

/**
 * Get tag info for a specific tag
 */
export function getTagInfo(tag: WalletTag): WalletTagInfo {
    return {
        tag,
        ...TAG_INFO[tag],
    };
}

/**
 * Get severity for a tag
 */
export function getTagSeverity(tag: string): TagSeverity {
    const normalizedTag = tag.toLowerCase().replace(/\s+/g, '_') as WalletTag;
    return TAG_INFO[normalizedTag]?.severity || 'neutral';
}

/**
 * Get color for tag severity
 */
export function getTagColor(severity: TagSeverity): string {
    const colors: Record<TagSeverity, string> = {
        positive: '#39FF14',
        neutral: '#888888',
        negative: '#FF003C',
    };
    return colors[severity];
}

/**
 * Format tag for display
 */
export function formatWalletTag(tag: string): string {
    return tag
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Classify wallet from maker_token_tags array
 */
export function classifyWallet(tags: string[]): WalletTag[] {
    return tags
        .map(tag => tag.toLowerCase().replace(/\s+/g, '_'))
        .filter((tag): tag is WalletTag => tag in TAG_INFO);
}

/**
 * Get primary tag (most significant) from list
 */
export function getPrimaryTag(tags: string[]): WalletTag | null {
    const classified = classifyWallet(tags);

    // Priority order (negative first for risk awareness)
    const priority: WalletTag[] = [
        'insider',
        'bundler',
        'sniper',
        'dev',
        'smart_degen',
        'renowned',
        'bluechip',
        'whale',
        'fresh',
        'dex_bot',
    ];

    for (const tag of priority) {
        if (classified.includes(tag)) {
            return tag;
        }
    }

    return classified[0] || null;
}

/**
 * Check if wallet has any negative tags
 */
export function hasNegativeTags(tags: string[]): boolean {
    return classifyWallet(tags).some(
        tag => TAG_INFO[tag]?.severity === 'negative'
    );
}

/**
 * Check if wallet has positive tags
 */
export function hasPositiveTags(tags: string[]): boolean {
    return classifyWallet(tags).some(
        tag => TAG_INFO[tag]?.severity === 'positive'
    );
}

/**
 * Calculate wallet risk score from tags
 */
export function calculateWalletRisk(tags: string[]): number {
    const classified = classifyWallet(tags);
    let score = 50; // Base neutral score

    for (const tag of classified) {
        const severity = TAG_INFO[tag]?.severity;
        if (severity === 'positive') score += 15;
        if (severity === 'negative') score -= 20;
    }

    return Math.max(0, Math.min(100, score));
}
