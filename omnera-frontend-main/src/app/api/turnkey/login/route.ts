import { NextRequest, NextResponse } from "next/server";
import { createUserWallet } from "@/lib/turnkey";
import axios from "axios";
import { config } from "@/config/env";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phantomAddress } = body;

    if (!phantomAddress || typeof phantomAddress !== "string") {
      return NextResponse.json(
        { error: "phantomAddress is required" },
        { status: 400 }
      );
    }

    if (phantomAddress.length < 32 || phantomAddress.length > 44) {
      return NextResponse.json(
        { error: "Invalid Solana address format" },
        { status: 400 }
      );
    }

    console.log("LOGIN: Creating new Turnkey wallet for:", phantomAddress);

    const userId = `phantom_${phantomAddress.slice(
      0,
      8
    )}_${phantomAddress.slice(-8)}`;
    const walletInfo = await createUserWallet(userId, phantomAddress);

    try {
      const saveResponse = await axios.post(
        `${config.baseServerUrl}/api/turnkey/save`,
        {
          phantom_address: phantomAddress,
          wallets: [
            {
              turnkey_wallet_id: walletInfo.turnkeyWalletId,
              turnkey_org_id: walletInfo.turnkeyOrgId,
              wallet_index: walletInfo.walletIndex,
              solana_address: walletInfo.solanaAddress,
              wallet_name: "omnera",
            },
          ],
        }
      );
      console.log("LOGIN: Wallet saved to database", saveResponse.data);
    } catch (saveError: unknown) {
      const status = (saveError as { response?: { status?: number } })?.response
        ?.status;
      if (status === 422) {
        console.log("LOGIN: Wallet already exists in database");
      } else {
        console.error("LOGIN: Failed to save wallet:", saveError);
        // Don't fail the request - wallet was created in Turnkey
      }
    }

    console.log("LOGIN: Wallet created successfully");

    return NextResponse.json({
      userId,
      phantomAddress,
      solanaAddress: walletInfo.solanaAddress,
      walletId: walletInfo.walletId,
      orgId: walletInfo.subOrganizationId,
      isNew: true,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed" },
      { status: 500 }
    );
  }
}
