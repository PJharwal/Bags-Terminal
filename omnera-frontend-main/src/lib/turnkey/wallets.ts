import { getTurnkeyApi } from "./client";
import { turnkeyServerConfig } from "./config";

export interface TurnkeyWalletInfo {
  subOrganizationId: string; // Will be same as parent org for custodial
  walletId: string;
  solanaAddress: string;
  turnkeyWalletId: string;
  turnkeyOrgId: string;
  walletIndex: number;
}

/**
 * Create a Turnkey wallet for custodial use
 * Wallets are created in the PARENT organization (not sub-orgs)
 * This allows the parent org's API key to sign transactions
 */
export async function createUserWallet(
  userId: string,
  userEmail: string
): Promise<TurnkeyWalletInfo> {
  console.log("CREATE_WALLET: Starting custodial wallet creation");
  console.log("CREATE_WALLET: userId:", userId);
  console.log(
    "CREATE_WALLET: Using org ID:",
    turnkeyServerConfig.organizationId
  );

  const api = getTurnkeyApi();
  const walletName = `omnera-wallet-${userId}`;

  try {
    // Try to create wallet directly in the PARENT organization (custodial)
    const result = await api.createWallet({
      walletName,
      accounts: [
        {
          curve: "CURVE_ED25519",
          pathFormat: "PATH_FORMAT_BIP32",
          path: "m/44'/501'/0'/0'",
          addressFormat: "ADDRESS_FORMAT_SOLANA",
        },
      ],
    });

    console.log(
      "CREATE_WALLET: API Response:",
      JSON.stringify(result, null, 2)
    );

    if (!result.walletId || !result.addresses?.[0]) {
      console.error("CREATE_WALLET: Missing wallet data in response:", result);
      throw new Error(
        "Failed to create wallet - missing wallet data in response"
      );
    }
    const walletInfo = {
      subOrganizationId: turnkeyServerConfig.organizationId,
      walletId: result.walletId,
      walletName: walletName,
      solanaAddress: result.addresses[0],
      turnkeyWalletId: result.walletId,
      turnkeyOrgId: turnkeyServerConfig.organizationId,
      walletIndex: 0,
    };

    console.log("CREATE_WALLET: Success!", walletInfo);
    return walletInfo;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("wallet label must be unique")) {
      console.log("CREATE_WALLET: Wallet exists, fetching from Turnkey...");

      const walletsResponse = await api.getWallets({
        organizationId: turnkeyServerConfig.organizationId,
      });

      const existingWallet = walletsResponse.wallets.find(
        (w: { walletName: string }) => w.walletName === walletName
      );

      if (existingWallet) {
        const accounts = await api.getWalletAccounts({
          organizationId: turnkeyServerConfig.organizationId,
          walletId: existingWallet.walletId,
        });

        const solanaAddress = accounts.accounts[0]?.address;
        if (solanaAddress) {
          const walletInfo = {
            subOrganizationId: turnkeyServerConfig.organizationId,
            walletId: existingWallet.walletId,
            solanaAddress,
            turnkeyWalletId: existingWallet.walletId,
            turnkeyOrgId: turnkeyServerConfig.organizationId,
            walletIndex: 0,
          };
          console.log("CREATE_WALLET: Found existing wallet!", walletInfo);
          return walletInfo;
        }
      }
    }

    console.error("CREATE_WALLET: Error:", error);
    throw error;
  }
}

export async function getWalletAddresses(
  organizationId: string,
  walletId: string
): Promise<string[]> {
  const api = getTurnkeyApi();

  const response = await api.getWalletAccounts({
    organizationId: organizationId,
    walletId: walletId,
  });

  return response.accounts.map(
    (account: { address: string }) => account.address
  );
}

export async function exportWalletKey(
  organizationId: string,
  walletId: string,
  targetPublicKey: string
): Promise<string> {
  const api = getTurnkeyApi();

  const result = await api.exportWallet({
    organizationId: organizationId,
    walletId: walletId,
    targetPublicKey: targetPublicKey,
  });

  return result.exportBundle;
}
function fetchUserWallets(phantomAddress: any) {
  throw new Error("Function not implemented.");
}
