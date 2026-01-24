import { Turnkey } from "@turnkey/sdk-server";
import { turnkeyServerConfig, validateTurnkeyConfig } from "./config";

// Singleton Turnkey client instance
let turnkeyInstance: Turnkey | null = null;

/**
 * Get the Turnkey server-side client
 * Uses singleton pattern to avoid creating multiple instances
 */
export function getTurnkeyClient(): Turnkey {
  if (turnkeyInstance) {
    return turnkeyInstance;
  }

  if (!validateTurnkeyConfig()) {
    throw new Error("Turnkey configuration is incomplete");
  }

  turnkeyInstance = new Turnkey({
    apiBaseUrl: turnkeyServerConfig.apiBaseUrl,
    apiPublicKey: turnkeyServerConfig.apiPublicKey,
    apiPrivateKey: turnkeyServerConfig.apiPrivateKey,
    defaultOrganizationId: turnkeyServerConfig.organizationId,
  });

  return turnkeyInstance;
}

/**
 * Get the Turnkey API client for making API calls
 */
export function getTurnkeyApi() {
  return getTurnkeyClient().apiClient();
}
