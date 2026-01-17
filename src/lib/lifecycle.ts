// Lifecycle State Engine for BAGS Pulse
// Deterministic state calculation - never inferred in UI

import type { PulseState } from './types';

/**
 * State Thresholds Configuration
 * These should match backend values
 */
export const LIFECYCLE_THRESHOLDS = {
    FINAL_STRETCH_MIN: 85, // Bonding % to enter Final Stretch
    MIGRATED_THRESHOLD: 100, // When LP goes live
} as const;

/**
 * Determine lifecycle state from bonding progress
 * This is for local simulation only - production uses backend-provided state
 */
export function determineLifecycleState(
    bondingProgress: number,
    lpLive: boolean = false
): PulseState {
    if (lpLive || bondingProgress >= LIFECYCLE_THRESHOLDS.MIGRATED_THRESHOLD) {
        return 'MIGRATED';
    }
    if (bondingProgress >= LIFECYCLE_THRESHOLDS.FINAL_STRETCH_MIN) {
        return 'FINAL_STRETCH';
    }
    return 'NEW';
}

/**
 * Get color for lifecycle state
 */
export function getStateColor(state: PulseState): string {
    switch (state) {
        case 'NEW':
            return '#3B82F6'; // Blue
        case 'FINAL_STRETCH':
            return '#F59E0B'; // Amber
        case 'MIGRATED':
            return '#10B981'; // Emerald
    }
}

/**
 * Get state display config
 */
export function getStateConfig(state: PulseState) {
    switch (state) {
        case 'NEW':
            return {
                label: 'New Creations',
                shortLabel: 'New',
                description: 'Bonding active',
                color: '#3B82F6',
                bgColor: 'rgba(59, 130, 246, 0.15)',
            };
        case 'FINAL_STRETCH':
            return {
                label: 'Final Stretch',
                shortLabel: 'Stretch',
                description: 'Near migration',
                color: '#F59E0B',
                bgColor: 'rgba(245, 158, 11, 0.15)',
            };
        case 'MIGRATED':
            return {
                label: 'Migrated',
                shortLabel: 'Migrated',
                description: 'LP live',
                color: '#10B981',
                bgColor: 'rgba(16, 185, 129, 0.15)',
            };
    }
}

/**
 * Format bonding progress for display
 */
export function formatBondingProgress(progress: number): string {
    if (progress >= 100) return '100%';
    if (progress < 1) return '<1%';
    return `${Math.floor(progress)}%`;
}

/**
 * Get bonding progress color based on percentage
 */
export function getBondingColor(progress: number): string {
    if (progress >= 85) return '#10B981'; // Green - near migration
    if (progress >= 50) return '#F59E0B'; // Amber - halfway
    if (progress >= 25) return '#3B82F6'; // Blue - early progress
    return 'rgba(255, 255, 255, 0.5)'; // Muted - just started
}

/**
 * Format age for display (compact)
 */
export function formatAge(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
}

/**
 * Get risk severity color
 */
export function getRiskColor(severity: 'info' | 'warn' | 'critical'): string {
    switch (severity) {
        case 'critical':
            return '#EF4444'; // Red
        case 'warn':
            return '#F59E0B'; // Amber
        case 'info':
            return '#10B981'; // Green
    }
}
