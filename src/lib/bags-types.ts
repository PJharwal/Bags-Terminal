// Bags.fm TypeScript Types

// ==========================================
// Token Types
// ==========================================

export interface BagsTokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string; // IPFS URL after upload
}

export interface BagsTokenLaunchConfig {
  metadata: BagsTokenMetadata;
  feeShareConfigKey: string;
  initialBuyAmountSol: number;
}

export interface BagsCreatedToken {
  mint: string;
  name: string;
  symbol: string;
  image: string;
  description: string;
  createdAt: number;
  creator: string;
  marketCap: number;
  totalFeesEarned: number;
  claimableFees: number;
  lastClaimTimestamp: number | null;
}

// ==========================================
// Fee Sharing Types
// ==========================================

export type FeeClaimerType = 'wallet' | 'social';

export type SocialProvider = 'twitter' | 'kick' | 'github' | 'tiktok';

export interface FeeClaimerConfig {
  id: string;
  type: FeeClaimerType;
  identifier: string; // wallet address or social handle
  provider?: SocialProvider; // only for social type
  percentage: number; // 0-100
}

export interface FeeShareConfig {
  configKey: string;
  claimers: FeeClaimerConfig[];
  createdAt: number;
}

export interface FeeClaimInfo {
  tokenMint: string;
  tokenSymbol: string;
  tokenImage: string;
  claimableAmount: number; // in SOL
  totalEarned: number;
  totalClaimed: number;
  lastClaimTimestamp: number | null;
}

export interface ClaimEvent {
  id: string;
  tokenMint: string;
  tokenSymbol: string;
  amount: number; // SOL
  timestamp: number;
  signature: string;
}

// ==========================================
// Swap Types
// ==========================================

export interface SwapQuote {
  inputToken: string;
  outputToken: string;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  minimumReceived: number;
  route: SwapRoute[];
  networkFee: number;
  platformFee: number;
}

export interface SwapRoute {
  pool: string;
  inputToken: string;
  outputToken: string;
  percentage: number;
}

export interface SwapParams {
  inputToken: string;
  outputToken: string;
  amount: number;
  slippageBps: number;
  priorityFee?: number;
}

export type SwapStatus = 'idle' | 'quoting' | 'pending' | 'confirming' | 'success' | 'error';

export interface SwapResult {
  signature: string;
  inputAmount: number;
  outputAmount: number;
  status: 'confirmed' | 'failed';
}

// ==========================================
// Social Linking Types
// ==========================================

export interface SocialLink {
  id: string;
  provider: SocialProvider;
  username: string;
  verified: boolean;
  linkedAt: number;
  walletAddress: string;
}

export interface SocialLookupResult {
  provider: SocialProvider;
  username: string;
  walletAddress: string;
  tokens: BagsCreatedToken[];
}

// ==========================================
// Launch Flow Types
// ==========================================

export type LaunchStatus =
  | 'idle'
  | 'uploading_image'
  | 'creating_config'
  | 'generating_tx'
  | 'awaiting_signature'
  | 'confirming'
  | 'success'
  | 'error';

export interface LaunchResult {
  tokenMint: string;
  signature: string;
  configKey: string;
}

// ==========================================
// Transaction History Types
// ==========================================

export type TransactionType = 'swap' | 'launch' | 'claim';

export interface TransactionRecord {
  id: string;
  type: TransactionType;
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  details: {
    tokenSymbol?: string;
    tokenMint?: string;
    amountIn?: number;
    amountOut?: number;
    side?: 'buy' | 'sell';
  };
}

// ==========================================
// API Response Types
// ==========================================

export interface BagsApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ImageUploadResponse {
  ipfsUrl: string;
  ipfsHash: string;
}

// ==========================================
// SOL Constants
// ==========================================

export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const LAMPORTS_PER_SOL = 1_000_000_000;
