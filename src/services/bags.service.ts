/**
 * Bags.fm Service Layer
 * Hybrid SDK + API service for token launches, swaps, fee claims, and social linking
 * Updated for Bags API v3 with partner config, tips, multiple claimers, and fee-share/wallet/v2
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
  BagsTokenCreator,
  BagsTokenCreatorWithStats,
  BagsTokenClaimEvent,
  TipConfig,
  PartnerConfig,
  PartnerClaimInfo,
  FeeShareWalletInfo,
  LookupTableConfig,
  BagsLeaderboardItem,
  BagsLaunchFeedItem,
  BagsPoolData,
  FeeShareAdminToken,
  DexscreenerOrder,
  DexscreenerAvailability,
  ClaimTransactionV3,
  BagsPool,
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

/**
 * Create token info with optional IPFS bypass.
 * When imageUrl is provided, skips IPFS upload for images.
 * When metadataUrl is provided, skips IPFS upload entirely.
 */
async function createTokenInfo(
  metadata: BagsTokenMetadata
): Promise<{ metadataUrl: string; imageUrl: string }> {
  const body: Record<string, string> = {
    name: metadata.name,
    symbol: metadata.symbol,
    description: metadata.description,
  };

  // If metadataUrl is provided, skip IPFS entirely
  if (metadata.metadataUrl) {
    body.metadataUrl = metadata.metadataUrl;
  }

  // If imageUrl is provided, skip IPFS for image
  if (metadata.imageUrl) {
    body.imageUrl = metadata.imageUrl;
  } else if (metadata.image) {
    body.image = metadata.image;
  }

  const result = await postBags<{ metadataUrl: string; imageUrl: string }>(
    '/token-launch/create-token-info',
    body
  );
  if (!result) throw new Error('Failed to create token info');
  return result;
}

async function createFeeShareConfig(
  claimers: FeeClaimerConfig[],
  additionalLookupTables?: string[]
): Promise<string> {
  const result = await postBags<{ configKey: string }>('/token/fee-config', {
    claimers: claimers.map((c) => ({
      type: c.type,
      identifier: c.identifier,
      provider: c.provider,
      percentage: c.percentage,
    })),
    ...(additionalLookupTables && { additionalLookupTables }),
  });
  if (!result) throw new Error('Failed to create fee share config');
  return result.configKey;
}

/**
 * Get lookup table creation transactions for configs with >15 fee claimers.
 * Must be called and confirmed before creating the fee share config.
 */
async function getConfigLookupTableTransactions(
  walletAddress: string,
  claimerCount: number
): Promise<LookupTableConfig> {
  const result = await postBags<LookupTableConfig>(
    '/token/fee-config/lookup-table',
    { walletAddress, claimerCount }
  );
  if (!result) throw new Error('Failed to get lookup table transactions');
  return result;
}

async function createTokenLaunch(
  metadata: BagsTokenMetadata,
  configKey: string,
  initialBuyAmountSol: number,
  walletAddress: string,
  options?: {
    tip?: TipConfig;
    partner?: string;              // Partner key for fee attribution
    partnerConfig?: PartnerConfig;  // Full partner config object
  }
): Promise<{ transaction: string; tokenMint: string }> {
  const result = await postBags<{ transaction: string; tokenMint: string }>(
    '/token/launch',
    {
      metadata,
      configKey,
      initialBuyAmountSol,
      walletAddress,
      ...(options?.tip && { tipWallet: options.tip.tipWallet, tipLamports: options.tip.tipLamports }),
      ...(options?.partner && { partner: options.partner }),
      ...(options?.partnerConfig && { partnerConfig: options.partnerConfig }),
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

/**
 * Create claim transactions (returns Transaction[] instead of VersionedTransaction[])
 */
async function createClaimTransaction(
  tokenMint: string,
  walletAddress: string
): Promise<string[]> {
  const result = await postBags<{ transactions: string[] }>('/creator/claim', {
    tokenMint,
    walletAddress,
  });
  if (!result) throw new Error('Failed to create claim transaction');
  // Support both single transaction (legacy) and array of transactions (v2)
  return result.transactions || [result as unknown as string];
}

// ==========================================
// Partner Configuration Methods
// ==========================================

/**
 * Create a partner configuration key for receiving fees from multiple token launches
 */
async function createPartnerConfig(
  walletAddress: string
): Promise<PartnerConfig> {
  const result = await postBags<PartnerConfig>('/partner/config', {
    walletAddress,
  });
  if (!result) throw new Error('Failed to create partner config');
  return result;
}

/**
 * Get partner configuration for a wallet
 */
async function getPartnerConfig(wallet: string): Promise<PartnerConfig | null> {
  return fetchBags<PartnerConfig>(`/partner/config?wallet=${wallet}`);
}

/**
 * Get claimable partner fees
 */
async function getPartnerClaimable(partnerKey: string): Promise<PartnerClaimInfo | null> {
  return fetchBags<PartnerClaimInfo>(`/partner/claimable?partnerKey=${partnerKey}`);
}

/**
 * Create claim transactions for partner fees
 */
async function createPartnerClaimTransactions(
  partnerKey: string,
  walletAddress: string
): Promise<string[]> {
  const result = await postBags<{ transactions: string[] }>('/partner/claim', {
    partnerKey,
    walletAddress,
  });
  if (!result) throw new Error('Failed to create partner claim transactions');
  return result.transactions;
}

// ==========================================
// Fee Share Wallet v2 Methods
// ==========================================

/**
 * Get fee share wallet info (v2) with support for GitHub, Kick, TikTok, and Twitter
 */
async function getFeeShareWalletInfo(wallet: string): Promise<FeeShareWalletInfo | null> {
  return fetchBags<FeeShareWalletInfo>(`/fee-share/wallet/v2?wallet=${wallet}`);
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
 * Get all fee earners/creators for a token (v3 endpoint with full details)
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
 * Get claim events history for a token.
 * v1.2.0: supports time-based filtering via mode, from, to params.
 */
async function getTokenClaimEvents(
  mint: string,
  options: {
    limit?: number;
    offset?: number;
    mode?: 'all' | 'range';
    from?: number; // Unix timestamp (seconds)
    to?: number;   // Unix timestamp (seconds)
  } = {}
): Promise<BagsTokenClaimEvent[]> {
  const { limit = 50, offset = 0, mode, from, to } = options;
  const params = new URLSearchParams({
    tokenMint: mint,
    limit: String(limit),
    offset: String(offset),
  });
  if (mode) params.set('mode', mode);
  if (from !== undefined) params.set('from', String(from));
  if (to !== undefined) params.set('to', String(to));

  const result = await fetchBags<{ events: BagsTokenClaimEvent[] }>(
    `/fee-share/token/claim-events?${params.toString()}`
  );
  return result?.events || [];
}

/**
 * Get complete fee info for a token (lifetime fees + creators)
 * Cached for 60s to prevent API flooding
 */
const feeInfoCache = new Map<string, { data: { lifetimeFees: number; creators: BagsTokenCreator[] } | null; ts: number }>();
const FEE_CACHE_MAX = 200;

async function getTokenFeeInfo(mint: string): Promise<{
  lifetimeFees: number;
  creators: BagsTokenCreator[];
} | null> {
  const cached = feeInfoCache.get(mint);
  if (cached && Date.now() - cached.ts < 60_000) return cached.data;

  try {
    const [lifetimeFees, creators] = await Promise.all([
      getTokenLifetimeFees(mint),
      getTokenCreators(mint),
    ]);
    const data = { lifetimeFees, creators };
    if (feeInfoCache.size >= FEE_CACHE_MAX) {
      const firstKey = feeInfoCache.keys().next().value;
      if (firstKey) feeInfoCache.delete(firstKey);
    }
    feeInfoCache.set(mint, { data, ts: Date.now() });
    return data;
  } catch (error) {
    console.error('Failed to get token fee info:', error);
    if (feeInfoCache.size >= FEE_CACHE_MAX) {
      const firstKey = feeInfoCache.keys().next().value;
      if (firstKey) feeInfoCache.delete(firstKey);
    }
    feeInfoCache.set(mint, { data: null, ts: Date.now() });
    return null;
  }
}

// ==========================================
// Leaderboard Methods (SDK v1.3.4)
// ==========================================

async function getTopTokensByFees(): Promise<BagsLeaderboardItem[]> {
  const result = await fetchBags<{ response: BagsLeaderboardItem[] }>(
    '/token-launch/leaderboard'
  );
  return result?.response || [];
}

// ==========================================
// Launch Feed Methods
// ==========================================

async function getLaunchFeed(options: {
  limit?: number;
  offset?: number;
} = {}): Promise<BagsLaunchFeedItem[]> {
  const { limit = 50, offset = 0 } = options;
  const result = await fetchBags<BagsLaunchFeedItem[]>(
    `/token-launch/feed?limit=${limit}&offset=${offset}`
  );
  return result || [];
}

// ==========================================
// Pool Data Methods
// ==========================================

async function getPoolByTokenMint(mint: string): Promise<BagsPoolData | null> {
  return fetchBags<BagsPoolData>(`/pool/by-token-mint?tokenMint=${mint}`);
}

// ==========================================
// Fee Share Admin Methods
// ==========================================

async function getAdminTokens(wallet: string): Promise<FeeShareAdminToken[]> {
  const result = await fetchBags<FeeShareAdminToken[]>(
    `/fee-share/admin/tokens?wallet=${wallet}`
  );
  return result || [];
}

async function transferFeeShareAdmin(
  tokenMint: string,
  currentAdmin: string,
  newAdmin: string
): Promise<string> {
  const result = await postBags<{ transaction: string }>('/fee-share/admin/transfer', {
    tokenMint,
    currentAdmin,
    newAdmin,
  });
  if (!result) throw new Error('Failed to create admin transfer transaction');
  return result.transaction;
}

async function updateFeeShareConfig(
  tokenMint: string,
  claimers: FeeClaimerConfig[],
  walletAddress: string
): Promise<string[]> {
  const result = await postBags<{ transactions: string[] }>('/fee-share/admin/update-config', {
    tokenMint,
    claimers: claimers.map(c => ({
      type: c.type,
      identifier: c.identifier,
      provider: c.provider,
      percentage: c.percentage,
    })),
    walletAddress,
  });
  if (!result) throw new Error('Failed to update fee share config');
  return result.transactions;
}

// ==========================================
// Dexscreener Integration Methods
// ==========================================

async function createDexscreenerOrder(
  tokenMint: string,
  walletAddress: string
): Promise<DexscreenerOrder> {
  const result = await postBags<DexscreenerOrder>('/solana/dexscreener/create-order', {
    tokenMint,
    walletAddress,
  });
  if (!result) throw new Error('Failed to create Dexscreener order');
  return result;
}

async function checkDexscreenerAvailability(tokenMint: string): Promise<DexscreenerAvailability> {
  const result = await fetchBags<DexscreenerAvailability>(
    `/solana/dexscreener/order-availability?tokenMint=${tokenMint}`
  );
  if (!result) throw new Error('Failed to check Dexscreener availability');
  return result;
}

async function submitDexscreenerPayment(
  orderId: string,
  signedTransaction: string
): Promise<{ success: boolean }> {
  const result = await postBags<{ success: boolean }>('/solana/dexscreener/submit-payment', {
    orderId,
    signedTransaction,
  });
  if (!result) throw new Error('Failed to submit Dexscreener payment');
  return result;
}

// ==========================================
// V3 Auto-Claim Methods
// ==========================================

async function getClaimTransactionsV3(
  tokenMint: string,
  walletAddress: string
): Promise<string[]> {
  const result = await fetchBags<{ transactions: string[] }>(
    `/token-launch/claim-txs/v3?tokenMint=${tokenMint}&wallet=${walletAddress}`
  );
  return result?.transactions || [];
}

// ==========================================
// All Pools Methods
// ==========================================

async function getAllPools(): Promise<BagsPool[]> {
  const result = await fetchBags<BagsPool[]>('/solana/bags/pools');
  return result || [];
}

// ==========================================
// Transaction Submission
// ==========================================

async function sendTransaction(signedTransaction: string): Promise<{ signature: string }> {
  const result = await postBags<{ signature: string }>('/solana/send-transaction', {
    transaction: signedTransaction,
  });
  if (!result) throw new Error('Failed to send transaction');
  return result;
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
  createTokenInfo,
  createFeeShareConfig,
  getConfigLookupTableTransactions,
  createTokenLaunch,

  // Creator
  getCreatedTokens,
  getClaimableFees,
  getClaimHistory,

  // Partner Config
  createPartnerConfig,
  getPartnerConfig,
  getPartnerClaimable,
  createPartnerClaimTransactions,

  // Fee Share Wallet v2
  getFeeShareWalletInfo,

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

  // Leaderboard
  getTopTokensByFees,

  // Launch Feed
  getLaunchFeed,

  // Pool Data
  getPoolByTokenMint,

  // Fee Share Admin
  getAdminTokens,
  transferFeeShareAdmin,
  updateFeeShareConfig,

  // Dexscreener
  createDexscreenerOrder,
  checkDexscreenerAvailability,
  submitDexscreenerPayment,

  // V3 Auto-Claim
  getClaimTransactionsV3,

  // Pools
  getAllPools,

  // Transaction
  sendTransaction,
};

export default bagsService;
