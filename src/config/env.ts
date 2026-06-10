// Environment configuration
export const config = {
  // Backend server URL (for token data, socket connections)
  // Uses solshift.fun backend for live token data
  baseServerUrl:
    process.env.NEXT_PUBLIC_BASE_SERVER_URL || "https://backend.solshift.fun",

  // GMGN API server URL (for token info, security, traders, holders)
  baseGmgnUrl: process.env.NEXT_PUBLIC_BASE_GMGN_URL || "",

  // Solana RPC URL (for wallet transactions)
  solanaRpcUrl:
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    "https://api.mainnet-beta.solana.com",

  buysellServerUrl:
    process.env.NEXT_PUBLIC_BUYSELL_SERVER_URL || "",

  // Canonical public site URL — used for shareable/referral links so tweets and
  // share cards never bake in localhost or a preview host.
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.bagsterminal.fm",

  // Turnkey Configuration (public keys only - private keys are server-side)
  turnkey: {
    organizationId: process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID || "",
    apiBaseUrl:
      process.env.NEXT_PUBLIC_TURNKEY_API_BASE_URL || "https://api.turnkey.com",
  },
} as const;

if (typeof window !== 'undefined' && !config.baseGmgnUrl) {
  console.error('[BAGS Terminal] NEXT_PUBLIC_BASE_GMGN_URL is not configured');
}
if (typeof window !== 'undefined' && !config.buysellServerUrl) {
  console.error('[BAGS Terminal] NEXT_PUBLIC_BUYSELL_SERVER_URL is not configured');
}
