/**
 * BAGS Token Discovery Service
 * Since Bags.fm API doesn't have a discovery endpoint, we maintain a list of known BAGS tokens
 * and provide methods to fetch their fee data
 */

import { bagsService } from './bags.service';
import { SOL_PRICE } from '@/lib/constants';
import type { BagsTokenCreator, BagsTokenCreatorWithStats, BagsTokenClaimEvent } from '@/lib/bags-types';

// Known BAGS tokens - these are real tokens deployed on bags.fm
// Users can add more via the UI
const KNOWN_BAGS_TOKENS: BagsTokenInfo[] = [
  {
    mint: 'CyXBDcVQuHyEDbG661Jf3iHqxyd9wNHhE2SiQdNrBAGS',
    name: 'PublicFund',
    symbol: 'PFUND',
    logo: 'https://pbs.twimg.com/profile_images/1932587627427069952/IjXVw17a.jpg',
  },
];

export interface BagsTokenInfo {
  mint: string;
  name: string;
  symbol: string;
  logo?: string;
}

export interface BagsTokenWithFeeData extends BagsTokenInfo {
  lifetimeFees: number;
  lifetimeFeesUsd: number;
  creators: BagsTokenCreator[];
  claimStats?: BagsTokenCreatorWithStats[];
  recentClaims?: BagsTokenClaimEvent[];
  totalRoyaltyBps: number;
  isLoading: boolean;
  error?: string;
}

// In-memory store for user-added tokens (persisted to localStorage)
let userAddedTokens: BagsTokenInfo[] = [];

// Load user tokens from localStorage
function loadUserTokens(): BagsTokenInfo[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('bags_user_tokens');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save user tokens to localStorage
function saveUserTokens(tokens: BagsTokenInfo[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('bags_user_tokens', JSON.stringify(tokens));
  } catch {
    // Ignore storage errors
  }
}

// Initialize user tokens
if (typeof window !== 'undefined') {
  userAddedTokens = loadUserTokens();
}

/**
 * Get all known BAGS tokens (built-in + user-added)
 */
export function getAllBagsTokens(): BagsTokenInfo[] {
  return [...KNOWN_BAGS_TOKENS, ...userAddedTokens];
}

/**
 * Add a user token
 */
export function addUserToken(token: BagsTokenInfo): void {
  // Check if already exists
  const exists = [...KNOWN_BAGS_TOKENS, ...userAddedTokens].some(
    t => t.mint.toLowerCase() === token.mint.toLowerCase()
  );
  if (!exists) {
    userAddedTokens.push(token);
    saveUserTokens(userAddedTokens);
  }
}

/**
 * Remove a user token
 */
export function removeUserToken(mint: string): void {
  userAddedTokens = userAddedTokens.filter(
    t => t.mint.toLowerCase() !== mint.toLowerCase()
  );
  saveUserTokens(userAddedTokens);
}

/**
 * Validate if a mint address is a valid BAGS token by checking the API
 */
export async function validateBagsToken(mint: string): Promise<{
  isValid: boolean;
  lifetimeFees?: number;
  creators?: BagsTokenCreator[];
  error?: string;
}> {
  try {
    const [lifetimeFees, creators] = await Promise.all([
      bagsService.getTokenLifetimeFees(mint),
      bagsService.getTokenCreators(mint),
    ]);

    // If we get valid data (even 0 fees), it's a valid BAGS token
    if (lifetimeFees !== undefined || (creators && creators.length > 0)) {
      return {
        isValid: true,
        lifetimeFees: lifetimeFees || 0,
        creators: creators || [],
      };
    }

    return { isValid: false, error: 'Token not found in Bags.fm' };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Failed to validate token'
    };
  }
}

/**
 * Fetch complete fee data for a BAGS token
 */
export async function fetchBagsTokenFeeData(
  token: BagsTokenInfo,
  solPrice: number = SOL_PRICE
): Promise<BagsTokenWithFeeData> {
  try {
    const [lifetimeFees, creators, claimStats] = await Promise.all([
      bagsService.getTokenLifetimeFees(token.mint),
      bagsService.getTokenCreators(token.mint),
      bagsService.getTokenClaimStats(token.mint).catch(() => []),
    ]);

    // Calculate total royalty percentage
    const totalRoyaltyBps = creators.reduce((sum, c) => sum + c.royaltyBps, 0);

    return {
      ...token,
      lifetimeFees,
      lifetimeFeesUsd: lifetimeFees * solPrice,
      creators,
      claimStats: claimStats || undefined,
      totalRoyaltyBps,
      isLoading: false,
    };
  } catch (error) {
    return {
      ...token,
      lifetimeFees: 0,
      lifetimeFeesUsd: 0,
      creators: [],
      totalRoyaltyBps: 0,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to fetch fee data',
    };
  }
}

/**
 * Fetch fee data for all known BAGS tokens
 */
export async function fetchAllBagsTokensFeeData(
  solPrice: number = SOL_PRICE
): Promise<BagsTokenWithFeeData[]> {
  const allTokens = getAllBagsTokens();

  const results = await Promise.all(
    allTokens.map(token => fetchBagsTokenFeeData(token, solPrice))
  );

  // Sort by lifetime fees descending
  return results.sort((a, b) => b.lifetimeFees - a.lifetimeFees);
}

export const bagsTokensService = {
  getAllBagsTokens,
  addUserToken,
  removeUserToken,
  validateBagsToken,
  fetchBagsTokenFeeData,
  fetchAllBagsTokensFeeData,
};

export default bagsTokensService;
