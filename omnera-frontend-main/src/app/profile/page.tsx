"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTurnkey } from "@/components/turnkey/TurnkeyProvider";
import { ExportKeyModal } from "@/components/turnkey/ExportKeyModal";
import {
  Wallet,
  Plus,
  Copy,
  Check,
  Key,
  RefreshCw,
  ArrowLeft,
  ExternalLink,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface WalletInfo {
  type: "phantom" | "turnkey";
  label: string;
  address: string;
  balance: number | null;
}

export default function ProfilePage() {
  const { publicKey, disconnect } = useWallet();
  const {
    user,
    isAuthenticated,
    turnkeyAddress,
    phantomAddress,
    balance,
    refreshBalance,
    logout,
  } = useTurnkey();

  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    const newWallets: WalletInfo[] = [];

    if (phantomAddress) {
      newWallets.push({
        type: "phantom",
        label: "Identity Wallet (Phantom)",
        address: phantomAddress,
        balance: null,
      });
    }

    if (turnkeyAddress) {
      newWallets.push({
        type: "turnkey",
        label: "Trading Wallet (One-Click)",
        address: turnkeyAddress,
        balance: balance,
      });
    }

    setWallets(newWallets);
  }, [phantomAddress, turnkeyAddress, balance]);

  const handleCopy = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleDisconnect = () => {
    disconnect();
    logout();
  };

  if (!phantomAddress) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Wallet className="w-12 h-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold text-white">Not Connected</h2>
          <p className="text-muted-foreground">Connect your Phantom wallet</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-surface transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Wallet Management
              </h1>
              <p className="text-sm text-muted-foreground">
                {phantomAddress.slice(0, 8)}...{phantomAddress.slice(-8)}
              </p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 rounded-lg border border-border hover:bg-surface text-muted-foreground hover:text-white transition-colors"
          >
            Disconnect
          </button>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Your Wallets</h2>

          <div className="grid gap-4">
            {wallets.map((wallet) => (
              <div
                key={wallet.address}
                className="p-6 rounded-xl border border-border bg-surface"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        wallet.type === "turnkey"
                          ? "bg-green-500/20"
                          : "bg-purple-500/20"
                      }`}
                    >
                      {wallet.type === "turnkey" ? (
                        <Zap className="w-5 h-5 text-green-400" />
                      ) : (
                        <Wallet className="w-5 h-5 text-purple-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-white flex items-center gap-2">
                        {wallet.label}
                        {wallet.type === "turnkey" && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
                            Active for Trading
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">Solana</p>
                    </div>
                  </div>

                  {wallet.type === "turnkey" && (
                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">
                        {wallet.balance !== null
                          ? `${wallet.balance.toFixed(4)} SOL`
                          : "—"}
                      </p>
                      <button
                        onClick={refreshBalance}
                        className="text-xs text-muted-foreground hover:text-white flex items-center gap-1 ml-auto"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Refresh
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-1">Address</p>
                  <div
                    onClick={() => handleCopy(wallet.address)}
                    className="flex items-center gap-2 p-3 rounded-lg bg-background border border-border cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <code className="flex-1 text-sm text-white font-mono truncate">
                      {wallet.address}
                    </code>
                    <button className="p-1.5 rounded-md hover:bg-white/10 transition-colors">
                      {copiedAddress === wallet.address ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {wallet.type === "turnkey" && (
                    <button
                      onClick={() => setExportModalOpen(true)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-background text-sm text-muted-foreground hover:text-white transition-colors"
                    >
                      <Key className="w-4 h-4" />
                      Export Private Key
                    </button>
                  )}
                  <a
                    href={`https://solscan.io/account/${wallet.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-background text-sm text-muted-foreground hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Explorer
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-400">
            💡 <strong>Tip:</strong> Fund your Trading Wallet with SOL for
            one-click trading. Your Phantom wallet is used for identity only.
          </p>
        </div>
      </div>

      {user && (
        <ExportKeyModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          userId={user.id}
          walletAddress={turnkeyAddress || ""}
          publicKey={publicKey || ""}
        />
      )}
    </div>
  );
}
