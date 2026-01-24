import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { config } from "@/config/env";
import axios from "axios";

const RUST_BACKEND_URL = "http://localhost:3001";
const connection = new Connection(config.solanaRpcUrl);

export async function GET(request: NextRequest) {
  try {
    const phantomAddress = request.nextUrl.searchParams.get("phantomAddress");

    if (!phantomAddress) {
      return NextResponse.json(
        { error: "phantomAddress is required" },
        { status: 400 }
      );
    }

    try {
      const dbResponse = await axios.get(
        `${config.buysellServerUrl}/api/turnkey/user/${phantomAddress}`
      );

      if (!dbResponse.data?.wallets?.length) {
        return NextResponse.json(
          { error: "Wallet not found" },
          { status: 404 }
        );
      }

      const wallet = dbResponse.data.wallets[0];

      let balance = 0;
      let balanceSol = 0;
      try {
        const pubkey = new PublicKey(wallet.solanaAddress);
        balance = await connection.getBalance(pubkey);
        balanceSol = balance / LAMPORTS_PER_SOL;
      } catch (balanceError) {
        console.warn("Error fetching balance:", balanceError);
      }

      return NextResponse.json({
        solanaAddress: wallet.solanaAddress,
        walletId: wallet.turnkeyWalletId,
        orgId: wallet.turnkeyOrgId,
        balance,
        balanceSol,
      });
    } catch (dbError: unknown) {
      const status = (dbError as { response?: { status?: number } })?.response
        ?.status;
      if (status === 404) {
        return NextResponse.json(
          { error: "Wallet not found" },
          { status: 404 }
        );
      }
      throw dbError;
    }
  } catch (error) {
    console.error("Error getting wallet:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get wallet",
      },
      { status: 500 }
    );
  }
}
