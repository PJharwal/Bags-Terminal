import { NextRequest, NextResponse } from "next/server";
import { signAndBroadcastTransaction } from "@/lib/turnkey";
import axios from "axios";
import { config } from "@/config/env";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      phantomAddress,
      mint,
      action,
      amount,
      slippage_bps,
      expected_output,
      quote_mint,
    } = body;

    if (!phantomAddress || !mint || !action || !amount) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: phantomAddress, mint, action, amount",
        },
        { status: 400 }
      );
    }

    if (!["buy", "sell"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'buy' or 'sell'" },
        { status: 400 }
      );
    }

    console.log("TRADE: Fetching wallet for:", phantomAddress);

    let wallet;
    try {
      const dbResponse = await axios.get(
        `${config.buysellServerUrl}/api/turnkey/user/${phantomAddress}`
      );

      if (!dbResponse.data?.wallets?.length) {
        return NextResponse.json(
          { error: "No wallet found. Please create a wallet first." },
          { status: 404 }
        );
      }

      wallet = dbResponse.data.wallets[0];
    } catch (dbError) {
      console.error("TRADE: Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch wallet from database" },
        { status: 500 }
      );
    }

    console.log("TRADE: Building tx with:", {
      user_pubkey: wallet.solanaAddress,
      mint,
      action,
      amount,
      expected_output: expected_output || 0,
    });

    const buildResponse = await fetch(
      `${config.buysellServerUrl}/api/build-tx`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_pubkey: wallet.solanaAddress,
          mint,
          action,
          amount,
          expected_output: expected_output || 0,
          slippage_bps: slippage_bps || 500,
          quote_mint: quote_mint,
          chain: "sol",
        }),
      }
    );

    if (!buildResponse.ok) {
      const errorText = await buildResponse.text();
      console.error("Build TX error:", errorText);
      return NextResponse.json(
        { error: `Failed to build transaction: ${errorText}` },
        { status: buildResponse.status }
      );
    }

    const buildData = await buildResponse.json();

    if (buildData.error) {
      return NextResponse.json({ error: buildData.error }, { status: 400 });
    }

    if (!buildData.unsigned_tx) {
      return NextResponse.json(
        { error: "No transaction returned from build API" },
        { status: 500 }
      );
    }

    const { signature, confirmationStatus } = await signAndBroadcastTransaction(
      wallet.turnkeyOrgId,
      wallet.solanaAddress,
      buildData.unsigned_tx
    );

    return NextResponse.json({
      success: true,
      signature,
      confirmationStatus,
      platform: buildData.platform,
      explorer: `https://solscan.io/tx/${signature}`,
    });
  } catch (error) {
    console.error("Trade error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Trade failed" },
      { status: 500 }
    );
  }
}
