import { TurnkeySigner } from "@turnkey/solana";
import { Connection, VersionedTransaction, Transaction } from "@solana/web3.js";
import { getTurnkeyClient } from "./client";
import { config } from "@/config/env";
import { turnkeyServerConfig } from "./config";

const connection = new Connection(config.solanaRpcUrl);

export interface SignAndBroadcastResult {
  signature: string;
  confirmationStatus: string;
}

/**
 * Sign and broadcast a transaction using Turnkey
 * For custodial wallets, uses the parent organization ID
 */
export async function signAndBroadcastTransaction(
  organizationId: string, // Should be parent org ID for custodial
  solanaAddress: string,
  unsignedTxBase64: string
): Promise<SignAndBroadcastResult> {
  console.log("SIGNING: Organization ID:", organizationId);
  console.log("SIGNING: solanaAddress:", solanaAddress);

  const client = getTurnkeyClient();

  // Create a signer for the organization that owns the wallet
  const signer = new TurnkeySigner({
    client: client.apiClient(),
    organizationId: organizationId,
  });

  // Deserialize the transaction
  const txBuffer = Buffer.from(unsignedTxBase64, "base64");
  let transaction: VersionedTransaction | Transaction;

  try {
    transaction = VersionedTransaction.deserialize(txBuffer);
  } catch {
    transaction = Transaction.from(txBuffer);
  }

  // Sign the transaction using the wallet address
  const signedTx = await signer.signTransaction(transaction, solanaAddress);

  // Broadcast the signed transaction to Solana
  const signature = await connection.sendRawTransaction(signedTx.serialize(), {
    skipPreflight: true,
    maxRetries: 3,
  });

  // Wait for confirmation
  const confirmation = await connection.confirmTransaction(
    signature,
    "confirmed"
  );

  return {
    signature,
    confirmationStatus: confirmation.value.err ? "failed" : "confirmed",
  };
}

export async function signTransaction(
  organizationId: string,
  solanaAddress: string,
  unsignedTxBase64: string
): Promise<string> {
  const client = getTurnkeyClient();

  const signer = new TurnkeySigner({
    client: client.apiClient(),
    organizationId: organizationId,
  });

  const txBuffer = Buffer.from(unsignedTxBase64, "base64");
  let transaction: VersionedTransaction | Transaction;

  try {
    transaction = VersionedTransaction.deserialize(txBuffer);
  } catch {
    transaction = Transaction.from(txBuffer);
  }

  const signedTx = await signer.signTransaction(transaction, solanaAddress);

  return Buffer.from(signedTx.serialize()).toString("base64");
}
