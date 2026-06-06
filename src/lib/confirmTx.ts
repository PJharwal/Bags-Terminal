import type { Connection } from "@solana/web3.js";

// A transaction signature is returned the instant the tx is *submitted* — it is
// computed locally from the signed bytes and says nothing about whether the tx
// landed. To know the on-chain outcome we must poll the chain. This typically
// resolves in ~1-3s ("confirmed" commitment), NOT instantly.
export type ConfirmResult = "confirmed" | "failed" | "timeout";

interface ConfirmOpts {
  timeoutMs?: number; // give up after this long (blockhash validity ~60-90s)
  intervalMs?: number; // poll cadence (~1 slot = 400ms)
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Poll getSignatureStatuses until the tx is confirmed/finalized, reverted, or
 * we time out.
 *  - "confirmed": landed with no error (confirmed or finalized commitment)
 *  - "failed":    landed but the instruction reverted (status.err != null)
 *  - "timeout":   never observed on-chain in time (likely dropped)
 */
export async function confirmSignature(
  connection: Connection,
  signature: string,
  opts: ConfirmOpts = {},
): Promise<ConfirmResult> {
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const intervalMs = opts.intervalMs ?? 600;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const { value } = await connection.getSignatureStatuses([signature], {
        searchTransactionHistory: false,
      });
      const status = value[0];
      if (status) {
        if (status.err) return "failed";
        if (
          status.confirmationStatus === "confirmed" ||
          status.confirmationStatus === "finalized"
        ) {
          return "confirmed";
        }
      }
    } catch {
      // transient RPC error — keep polling until the deadline
    }
    await sleep(intervalMs);
  }
  return "timeout";
}
