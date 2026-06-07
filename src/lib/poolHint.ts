import { config } from "@/config/env";

// Pool/DEX hint passed to the buysell backend so it routes the swap to the
// right program (pumpswap / meteora_damm / meteora_dbc / raydium_cpmm / ...).
// Single source of truth shared by the terminal trade panel and Pulse quick-buy.
export interface PoolHint {
  poolAddress?: string;
  poolType?: string;
  quoteAddress?: string;
  creatorAddress?: string;
  coinCreator?: string;
  baseVaultAddress?: string;
  quoteVaultAddress?: string;
  tokenStandard?: string;
}

export interface PoolHintInputs {
  exchange: string | null;
  poolAddress?: string | null;
  quoteAddress?: string | null;
  creatorAddress?: string | null;
  coinCreator?: string | null;
  baseVaultAddress?: string | null;
  quoteVaultAddress?: string | null;
  tokenStandard?: string;
}

// Map a GMGN `tpool.exchange` to the backend pool_type + the accounts that
// pool type needs. Mirrors the mapping the terminal trade panel uses.
export function mapExchangeToPoolHint(i: PoolHintInputs): PoolHint {
  const { exchange } = i;
  if (!exchange) return {};
  const poolAddress = i.poolAddress || undefined;
  const tokenStandard = i.tokenStandard || "spl";

  switch (exchange) {
    case "pump_amm":
      return {
        poolAddress,
        poolType: "pumpswap",
        creatorAddress: i.creatorAddress || undefined,
        coinCreator: i.coinCreator || undefined,
        baseVaultAddress: i.baseVaultAddress || undefined,
        quoteVaultAddress: i.quoteVaultAddress || undefined,
        tokenStandard,
      };
    case "meteora_dammv2":
      return { poolAddress, poolType: "meteora_damm" };
    case "ray_v4":
      return { poolAddress, poolType: "raydium_cpmm" };
    case "pumpfun":
    case "pump":
      return {
        poolAddress,
        poolType: "pumpfun",
        creatorAddress: i.creatorAddress || undefined,
        tokenStandard,
      };
    case "meteora_dbc":
      return { poolAddress, poolType: "meteora_dbc" };
    case "raydium_launchlab":
      return {
        poolAddress,
        poolType: "raydium_launchlab",
        quoteAddress: i.quoteAddress || undefined,
      };
    default:
      return {};
  }
}

interface GMGNTokenInfoResponse {
  code: number;
  message: string;
  data: {
    decimals: number;
    standard?: string;
    dev?: { creator_address?: string };
    tpool?: { exchange: string; pool_address: string; quote_address: string; creator?: string };
    pool?: { base_vault_address?: string; quote_vault_address?: string; quote_symbol?: string };
  }[];
}

// Fetch the pool hint for a mint from GMGN. Returns {} when GMGN is
// unavailable — the backend then auto-detects the platform from the mint.
export async function fetchPoolHint(mint: string): Promise<PoolHint> {
  if (!config.baseGmgnUrl) return {};
  try {
    const res = await fetch(`${config.baseGmgnUrl}/token/${mint}/info`);
    const data: GMGNTokenInfoResponse = await res.json();
    if (data.code === 0 && data.data?.length > 0) {
      const d = data.data[0];
      return mapExchangeToPoolHint({
        exchange: d.tpool?.exchange ?? null,
        poolAddress: d.tpool?.pool_address,
        quoteAddress: d.tpool?.quote_address || null,
        creatorAddress: d.dev?.creator_address || null,
        coinCreator: d.tpool?.creator || null,
        baseVaultAddress: d.pool?.base_vault_address || null,
        quoteVaultAddress: d.pool?.quote_vault_address || null,
        tokenStandard: d.standard === "2022" ? "2022" : "spl",
      });
    }
  } catch {
    /* GMGN unavailable — backend will auto-detect from the mint */
  }
  return {};
}
