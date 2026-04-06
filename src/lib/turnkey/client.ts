import { Turnkey } from "@turnkey/sdk-server";
import { turnkeyServerConfig, validateTurnkeyConfig } from "./config";

let turnkeyInstance: Turnkey | null = null;

export function getTurnkeyClient(): Turnkey {
  if (turnkeyInstance) return turnkeyInstance;

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

export function getTurnkeyApi() {
  return getTurnkeyClient().apiClient();
}
