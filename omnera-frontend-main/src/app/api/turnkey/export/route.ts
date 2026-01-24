import { NextRequest, NextResponse } from "next/server";
import { getTurnkeyApi } from "@/lib/turnkey";
import axios from "axios";
import { config } from "@/config/env";

const RUST_BACKEND_URL = "http://localhost:3001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phantomAddress, targetPublicKey } = body;

    if (!phantomAddress) {
      return NextResponse.json(
        { error: "phantomAddress is required" },
        { status: 400 }
      );
    }

    if (!targetPublicKey) {
      return NextResponse.json(
        { error: "targetPublicKey is required" },
        { status: 400 }
      );
    }

    // Fetch wallet from database
    const dbResponse = await axios.get(
      `${config.buysellServerUrl}/api/turnkey/user/${phantomAddress}`
    );
    console.log("Db response for wallet", dbResponse);
    if (!dbResponse.data?.wallets?.length) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const wallet = dbResponse.data.wallets[0];
    const api = getTurnkeyApi();

    const result = await api.exportWallet({
      organizationId: wallet.turnkeyOrgId,
      walletId: wallet.turnkeyWalletId,
      targetPublicKey: targetPublicKey,
    });

    return NextResponse.json({
      exportBundle: result.exportBundle,
      walletId: wallet.turnkeyWalletId,
      solanaAddress: wallet.solanaAddress,
      organizationId: wallet.turnkeyOrgId,
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to export wallet",
        details: error instanceof Error ? error.stack : String(error),
        rawError: JSON.parse(
          JSON.stringify(error, Object.getOwnPropertyNames(error))
        ),
      },
      { status: 500 }
    );
  }
}
