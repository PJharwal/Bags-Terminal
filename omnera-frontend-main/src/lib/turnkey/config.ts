// Turnkey server-side configuration
// Updated to match your .env.local variable names

export const turnkeyServerConfig = {
  // Your env uses TURNKEY_API_KEY instead of TURNKEY_API_PUBLIC_KEY
  apiPublicKey: process.env.TURNKEY_API_KEY || "",
  // Your env uses TURNKEY_API_SECRET instead of TURNKEY_API_PRIVATE_KEY
  apiPrivateKey: process.env.TURNKEY_API_SECRET || "",
  // Your env uses TURNKEY_ORG_ID instead of TURNKEY_ORGANIZATION_ID
  organizationId: process.env.TURNKEY_ORG_ID || "",
  apiBaseUrl: process.env.TURNKEY_API_BASE_URL || "https://api.turnkey.com",
};

export function validateTurnkeyConfig(): boolean {
  const config = turnkeyServerConfig;

  console.log("TURNKEY CONFIG CHECK:");
  console.log("  - apiPublicKey:", config.apiPublicKey ? "SET" : "MISSING");
  console.log("  - apiPrivateKey:", config.apiPrivateKey ? "SET" : "MISSING");
  console.log("  - organizationId:", config.organizationId ? "SET" : "MISSING");

  if (!config.apiPublicKey || !config.apiPrivateKey || !config.organizationId) {
    console.error("Missing required Turnkey environment variables!");
    console.error(
      "Expected: TURNKEY_API_KEY, TURNKEY_API_SECRET, TURNKEY_ORG_ID"
    );
    return false;
  }

  return true;
}
