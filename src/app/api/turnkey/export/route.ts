import { NextRequest, NextResponse } from "next/server";
import { getTurnkeyApi } from "@/lib/turnkey/client";
import { config } from "@/config/env";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phantomAddress, targetPublicKey } = body;

    if (!phantomAddress) {
      return NextResponse.json({ error: "phantomAddress is required" }, { status: 400 });
    }

    if (!targetPublicKey) {
      return NextResponse.json({ error: "targetPublicKey is required" }, { status: 400 });
    }

    // Fetch wallet info from omnera-buy-sell backendddd
    const dbResponse = await fetch(
      `${config.buysellServerUrl}/api/turnkey/user/${phantomAddress}`,
    );

    if (!dbResponse.ok) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const dbData = await dbResponse.json();
    if (!dbData?.wallets?.length) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const wallet = dbData.wallets[0];
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
      { error: error instanceof Error ? error.message : "Failed to export wallet" },
      { status: 500 },
    );
  }
}
