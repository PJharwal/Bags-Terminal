// Environment configuration
export const config = {
  // Backend server URL (for token data, socket connections)
  baseServerUrl:
    process.env.NEXT_PUBLIC_BASE_SERVER_URL || "http://localhost:3000",

  // GMGN API server URL (for token info, security, traders, holders)
  baseGmgnUrl: process.env.NEXT_PUBLIC_BASE_GMGN_URL || "http://localhost:8000",

  // Solana RPC URL (for wallet transactions)
  solanaRpcUrl:
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    "https://api.mainnet-beta.solana.com",

  buysellServerUrl:
    process.env.NEXT_PUBLIC_BUYSELL_SERVER_URL || "${config.buysellServerUrl}",

  // Turnkey Configuration (public keys only - private keys are server-side)
  turnkey: {
    organizationId: process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID || "",
    apiBaseUrl:
      process.env.NEXT_PUBLIC_TURNKEY_API_BASE_URL || "https://api.turnkey.com",
  },
} as const;
