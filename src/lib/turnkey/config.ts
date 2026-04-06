export const turnkeyServerConfig = {
  apiPublicKey: process.env.TURNKEY_API_KEY || "",
  apiPrivateKey: process.env.TURNKEY_API_SECRET || "",
  organizationId: process.env.TURNKEY_ORG_ID || "",
  apiBaseUrl: process.env.TURNKEY_API_BASE_URL || "https://api.turnkey.com",
};

export function validateTurnkeyConfig(): boolean {
  const config = turnkeyServerConfig;
  if (!config.apiPublicKey || !config.apiPrivateKey || !config.organizationId) {
    console.error("Missing required Turnkey environment variables: TURNKEY_API_KEY, TURNKEY_API_SECRET, TURNKEY_ORG_ID");
    return false;
  }
  return true;
}
