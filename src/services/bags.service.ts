/**
 * Bags.fm Service Layer
 * Hybrid SDK + API service for token launches, swaps, fee claims, and social linking
 */

import type {
  SwapQuote,
  SwapParams,
  BagsTokenMetadata,
  FeeClaimerConfig,
  BagsCreatedToken,
  FeeClaimInfo,
  ClaimEvent,
  SocialLink,
  SocialProvider,
  ImageUploadResponse,
  BagsApiResponse,
  BagsTokenCreator,
  BagsTokenCreatorWithStats,
  BagsTokenClaimEvent,
} from '@/lib/bags-types';

const BAGS_API_BASE = '/api/bags';

// ==========================================
// API Helper
// ==========================================

async function fetchBags<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    const response = await fetch(`${BAGS_API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`Bags API error [${response.status}]:`, error);
      throw new Error(error.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data ?? data;
  } catch (error) {
    console.error(`Bags API fetch error for ${endpoint}:`, error);
    throw error;
  }
}

async function postBags<T>(
  endpoint: string,
  body: unknown
): Promise<T | null> {
  return fetchBags<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ==========================================
// Swap Methods
// ==========================================

async function getSwapQuote(params: SwapParams): Promise<SwapQuote> {
  const result = await fetchBags<SwapQuote>(
    `/swap/quote?inputToken=${params.inputToken}&outputToken=${params.outputToken}&amount=${params.amount}&slippageBps=${params.slippageBps}`
  );
  if (!result) throw new Error('Failed to get swap quote');
  return result;
}

async function createSwapTransaction(
  params: SwapParams & { walletAddress: string }
): Promise<string> {
  // Returns serialized transaction as base64
  const result = await postBags<{ transaction: string }>('/swap/transaction', params);
  if (!result) throw new Error('Failed to create swap transaction');
  return result.transaction;
}

// ==========================================
// Token Launch Methods
// ==========================================

async function uploadTokenImage(file: File): Promise<ImageUploadResponse> {
  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Allowed: PNG, JPEG, WebP, GIF');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size: 5MB');
  }

  const formData = new FormData();
  formData.append('image', file);

  let retries = 3;
  while (retries > 0) {
    try {
      const response = await fetch(`${BAGS_API_BASE}/token/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data ?? data;
    } catch (err) {
      retries--;
      if (retries === 0) throw err;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  throw new Error('Failed to upload image after retries');
}

async function createFeeShareConfig(
  claimers: FeeClaimerConfig[]
): Promise<string> {
  const result = await postBags<{ configKey: string }>('/token/fee-config', {
    claimers: claimers.map((c) => ({
      type: c.type,
      identifier: c.identifier,
      provider: c.provider,
      percentage: c.percentage,
    })),
  });
  if (!result) throw new Error('Failed to create fee share config');
  return result.configKey;
}

async function createTokenLaunch(
  metadata: BagsTokenMetadata,
  configKey: string,
  initialBuyAmountSol: number,
  walletAddress: string
): Promise<{ transaction: string; tokenMint: string }> {
  const result = await postBags<{ transaction: string; tokenMint: string }>(
    '/token/launch',
    {
      metadata,
      configKey,
      initialBuyAmountSol,
      walletAddress,
    }
  );
  if (!result) throw new Error('Failed to create launch transaction');
  return result;
}

// ==========================================
// Creator / Fee Claiming Methods
// ==========================================

async function getCreatedTokens(wallet: string): Promise<BagsCreatedToken[]> {
  const result = await fetchBags<BagsCreatedToken[]>(`/creator/tokens?wallet=${wallet}`);
  return result || [];
}

async function getClaimableFees(wallet: string): Promise<FeeClaimInfo[]> {
  const result = await fetchBags<FeeClaimInfo[]>(`/creator/claimable?wallet=${wallet}`);
  return result || [];
}

async function getClaimHistory(wallet: string): Promise<ClaimEvent[]> {
  const result = await fetchBags<ClaimEvent[]>(`/creator/history?wallet=${wallet}`);
  return result || [];
}

async function createClaimTransaction(
  tokenMint: string,
  walletAddress: string
): Promise<string> {
  const result = await postBags<{ transaction: string }>('/creator/claim', {
    tokenMint,
    walletAddress,
  });
  if (!result) throw new Error('Failed to create claim transaction');
  return result.transaction;
}

// ==========================================
// Social Linking Methods
// ==========================================

async function getSocialLinks(wallet: string): Promise<SocialLink[]> {
  const result = await fetchBags<SocialLink[]>(`/social/links?wallet=${wallet}`);
  return result || [];
}

async function linkSocialAccount(
  provider: SocialProvider,
  username: string,
  walletAddress: string
): Promise<void> {
  await postBags('/social/link', { provider, username, walletAddress });
}

async function unlinkSocialAccount(
  provider: SocialProvider,
  username: string,
  walletAddress: string
): Promise<void> {
  await postBags('/social/unlink', { provider, username, walletAddress });
}

async function lookupBySocial(
  provider: SocialProvider,
  username: string
): Promise<string | null> {
  const result = await fetchBags<{ wallet: string }>(
    `/social/lookup?provider=${provider}&username=${username}`
  );
  return result?.wallet || null;
}

// ==========================================
// Token Info Methods
// ==========================================

async function getTokenMetadata(mint: string): Promise<BagsTokenMetadata | null> {
  return fetchBags<BagsTokenMetadata>(`/token/metadata?mint=${mint}`);
}

// ==========================================
// Token Fee Data Methods (Public API v2)
// ==========================================

/**
 * Get total lifetime fees earned by a token (in lamports)
 */
async function getTokenLifetimeFees(mint: string): Promise<number> {
  const result = await fetchBags<{ response: number }>(
    `/token-launch/lifetime-fees?tokenMint=${mint}`
  );
  // API returns lamports, convert to SOL
  return result?.response ? result.response / 1_000_000_000 : 0;
}

/**
 * Get all fee earners/creators for a token
 */
async function getTokenCreators(mint: string): Promise<BagsTokenCreator[]> {
  const result = await fetchBags<{ response: BagsTokenCreator[] }>(
    `/token-launch/creator/v3?tokenMint=${mint}`
  );
  return result?.response || [];
}

/**
 * Get claim statistics per earner (includes total claimed amounts)
 */
async function getTokenClaimStats(mint: string): Promise<BagsTokenCreatorWithStats[]> {
  const result = await fetchBags<{ response: BagsTokenCreatorWithStats[] }>(
    `/token-launch/claim-stats?tokenMint=${mint}`
  );
  return result?.response || [];
}

/**
 * Get claim events history for a token
 */
async function getTokenClaimEvents(
  mint: string,
  limit: number = 50,
  offset: number = 0
): Promise<BagsTokenClaimEvent[]> {
  const result = await fetchBags<{ events: BagsTokenClaimEvent[] }>(
    `/fee-share/token/claim-events?tokenMint=${mint}&limit=${limit}&offset=${offset}`
  );
  return result?.events || [];
}

/**
 * Get complete fee info for a token (lifetime fees + creators)
 */
async function getTokenFeeInfo(mint: string): Promise<{
  lifetimeFees: number;
  creators: BagsTokenCreator[];
} | null> {
  try {
    const [lifetimeFees, creators] = await Promise.all([
      getTokenLifetimeFees(mint),
      getTokenCreators(mint),
    ]);
    return { lifetimeFees, creators };
  } catch (error) {
    console.error('Failed to get token fee info:', error);
    return null;
  }
}

// ==========================================
// Export Service
// ==========================================

export const bagsService = {
  // Swap
  getSwapQuote,
  createSwapTransaction,

  // Token Launch
  uploadTokenImage,
  createFeeShareConfig,
  createTokenLaunch,

  // Creator
  getCreatedTokens,
  getClaimableFees,
  getClaimHistory,
  createClaimTransaction,

  // Social
  getSocialLinks,
  linkSocialAccount,
  unlinkSocialAccount,
  lookupBySocial,

  // Token Info
  getTokenMetadata,

  // Token Fee Data (Public API v2)
  getTokenLifetimeFees,
  getTokenCreators,
  getTokenClaimStats,
  getTokenClaimEvents,
  getTokenFeeInfo,
};

export default bagsService;
