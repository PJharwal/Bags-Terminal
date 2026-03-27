// Bags.fm TypeScript Types

// ==========================================
// Token Types
// ==========================================

export interface BagsTokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string; // IPFS URL after upload
  imageUrl?: string; // Direct image URL (skips IPFS upload when provided)
  metadataUrl?: string; // Direct metadata URL (skips IPFS upload entirely)
}

export interface BagsTokenLaunchConfig {
  metadata: BagsTokenMetadata;
  feeShareConfigKey: string;
  initialBuyAmountSol: number;
  tipWallet?: string; // Optional tip wallet address
  tipLamports?: number; // Optional tip amount in lamports
}

// ==========================================
// Tip Configuration
// ==========================================

export interface TipConfig {
  tipWallet: string;
  tipLamports: number;
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

export const MAX_FEE_CLAIMERS = 100; // Maximum fee earners per token launch

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
// Solana Wallet Types
// ==========================================

import type { Transaction, VersionedTransaction, Connection } from '@solana/web3.js';

export type SolanaTransaction = Transaction | VersionedTransaction;

export type SendTransactionFn = (
  transaction: SolanaTransaction,
  connection: Connection
) => Promise<string>;

export type SolanaConnection = Connection;

// ==========================================
// Raw API Response Types (from backend/socket)
// ==========================================

export interface RawTokenData {
  mint?: string;
  address?: string;
  name?: string;
  symbol?: string;
  creator?: string;
  market_cap_sol?: string;
  marketCapSol?: string;
  bonding_curve_percent?: string;
  top_10_holder_rate?: string;
  creation_timestamp?: number;
  created_at?: number;
  holder_count?: number;
  total_transactions?: number;
  volume_24h_sol?: string;
  logo_url?: string;
  image_uri?: string;
  protocol_source?: string;
  status?: string;
}

// ==========================================
// SOL Constants
// ==========================================

export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const LAMPORTS_PER_SOL = 1_000_000_000;

// ==========================================
// Token Fee Data Types (from SDK)
// ==========================================

export interface BagsTokenCreator {
  username: string;
  pfp: string;
  royaltyBps: number;           // Fee share in basis points (100 = 1%)
  isCreator: boolean;
  wallet: string;
  provider: SocialProvider | 'unknown' | null;
  providerUsername: string | null;
}

export interface BagsTokenCreatorWithStats extends BagsTokenCreator {
  totalClaimed: string;         // Total SOL claimed (string for precision)
}

export interface BagsTokenClaimEvent {
  wallet: string;
  isCreator: boolean;
  amount: string;               // SOL amount (string for precision)
  signature: string;
  timestamp: number;
}

export interface BagsTokenFeeInfo {
  mint: string;
  lifetimeFees: number;         // Total SOL fees earned
  creators: BagsTokenCreator[]; // Fee earners
}

export interface BagsTokenFeeInfoWithStats extends BagsTokenFeeInfo {
  creators: BagsTokenCreatorWithStats[];
  claimEvents: BagsTokenClaimEvent[];
}

// ==========================================
// Partner Configuration Types (v2)
// ==========================================

export interface PartnerConfig {
  partnerKey: string;
  wallet: string;
  createdAt: number;
  totalFeesEarned: number;
  tokenCount: number;
}

export interface PartnerClaimInfo {
  partnerKey: string;
  claimableAmount: number; // in SOL
  totalEarned: number;
  totalClaimed: number;
}

// ==========================================
// Fee Share Wallet v2 Types
// ==========================================

export interface FeeShareWalletInfo {
  wallet: string;
  provider: SocialProvider | null;
  providerUsername: string | null;
  totalEarned: number;
  totalClaimed: number;
  tokens: FeeShareWalletToken[];
}

export interface FeeShareWalletToken {
  tokenMint: string;
  tokenSymbol: string;
  tokenImage: string;
  royaltyBps: number;
  lifetimeFees: number;
  claimableAmount: number;
}

// ==========================================
// Lookup Table Types (for >15 claimers)
// ==========================================

export interface LookupTableConfig {
  lookupTableAddress: string;
  transactions: string[]; // Serialized transactions for LUT creation
}

// ==========================================
// Token Leaderboard Types (from SDK v1.3.4)
// ==========================================

export interface JupiterTokenAudit {
  topHoldersPercentage?: number;
  highSingleOwnership?: boolean;
  blockaidHoneypot?: boolean;
  mintAuthorityDisabled?: boolean;
  freezeAuthorityDisabled?: boolean;
  devMigrations?: number;
  blockaidRugpull?: boolean;
  blockaidWashTrading?: boolean;
  blockaidHiddenKeyHolder?: boolean;
}

export interface JupiterTokenStats {
  priceChange?: number;
  holderChange?: number;
  liquidityChange?: number;
  volumeChange?: number;
  buyVolume?: number;
  sellVolume?: number;
  numBuys?: number;
  numSells?: number;
  numTraders?: number;
}

export interface JupiterToken {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  twitter?: string;
  website?: string;
  telegram?: string;
  dev: string;
  circSupply: number;
  totalSupply: number;
  holderCount: number;
  audit: JupiterTokenAudit;
  organicScore: number;
  organicScoreLabel: string;
  tags: string[];
  fdv: number;
  mcap: number;
  usdPrice: number;
  liquidity: number;
  stats5m?: JupiterTokenStats;
  stats1h?: JupiterTokenStats;
  stats6h?: JupiterTokenStats;
  stats24h?: JupiterTokenStats;
  bondingCurve?: number;
  updatedAt: string;
}

export interface BagsLeaderboardItem {
  token: string;
  lifetimeFees: string;
  tokenInfo: JupiterToken | null;
  creators: BagsTokenCreator[] | null;
  tokenSupply: { amount: string; decimals: number; uiAmount: number | null } | null;
  tokenLatestPrice: { price: number; priceUSD: number; priceSOL: number; volumeUSD: number; volumeSOL: number; tokenAddress: string } | null;
}

// ==========================================
// Launch Feed Types
// ==========================================

export interface BagsLaunchFeedItem {
  mint: string;
  name: string;
  symbol: string;
  image: string;
  description: string;
  creator: string;
  createdAt: number;
  marketCap?: number;
  bondingCurve?: number;
  lifetimeFees?: number;
  creatorCount?: number;
}

// ==========================================
// Pool Data Types
// ==========================================

export interface BagsPoolData {
  poolAddress: string;
  tokenMint: string;
  baseMint: string;
  quoteMint: string;
  liquidity: number;
  volume24h: number;
  fee24h: number;
  currentPrice: number;
}

// ==========================================
// Fee Share Admin Types
// ==========================================

export interface FeeShareAdminToken {
  tokenMint: string;
  tokenSymbol: string;
  tokenImage: string;
  configKey: string;
  claimerCount: number;
}

export interface TransferAdminResult {
  transaction: string;
}

export interface UpdateFeeShareConfigResult {
  transaction: string;
}

// ==========================================
// Dexscreener Integration Types
// ==========================================

export interface DexscreenerOrder {
  orderId: string;
  tokenMint: string;
  paymentTransaction: string;
  amount: number;
  status: 'pending' | 'paid' | 'completed' | 'failed';
}

export interface DexscreenerAvailability {
  available: boolean;
  tokenMint: string;
  reason?: string;
}

// ==========================================
// V3 Claim Types
// ==========================================

export interface ClaimTransactionV3 {
  transactions: string[];
  tokenMint: string;
}

// ==========================================
// Pools Types
// ==========================================

export interface BagsPool {
  tokenMint: string;
  meteoraDbcPoolKey: string | null;
  dammV2PoolKey: string | null;
  name?: string;
  symbol?: string;
  image?: string;
}
