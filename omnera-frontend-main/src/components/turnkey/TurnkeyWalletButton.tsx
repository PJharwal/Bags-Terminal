"use client";

import { FC, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTurnkey } from "./TurnkeyProvider";
import {
  Wallet,
  LogOut,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  Zap,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TurnkeyWalletButtonProps {
  className?: string;
}

export const TurnkeyWalletButton: FC<TurnkeyWalletButtonProps> = ({
  className,
}) => {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const {
    user,
    isAuthenticated,
    isLoading,
    turnkeyAddress,
    balance,
    createWallet,
    logout,
  } = useTurnkey();

  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState<"phantom" | "turnkey" | null>(null);
  const [creating, setCreating] = useState(false);

  const phantomAddress = publicKey?.toBase58();

  // Auto-create wallet when user exists but has no wallets
  useEffect(() => {
    const autoCreate = async () => {
      if (
        connected &&
        phantomAddress &&
        user &&
        !user.activeWallet &&
        !isLoading &&
        !creating
      ) {
        setCreating(true);
        await createWallet();
        setCreating(false);
      }
    };
    autoCreate();
  }, [connected, phantomAddress, user, isLoading, creating, createWallet]);

  const handleCopy = (type: "phantom" | "turnkey", address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleDisconnect = () => {
    disconnect();
    logout();
    setShowDropdown(false);
  };

  if (!connected) {
    return (
      <button
        onClick={() => setVisible(true)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
          "bg-primary text-white hover:bg-primary/90",
          className
        )}
      >
        <Wallet size={16} />
        Connect Wallet
      </button>
    );
  }

  if (isLoading || creating) {
    return (
      <button
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface text-muted-foreground",
          className
        )}
        disabled
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        {creating ? "Creating Wallet..." : "Loading..."}
      </button>
    );
  }

  // Connected but no Turnkey wallet yet - show create button
  if (!isAuthenticated || !turnkeyAddress) {
    return (
      <button
        onClick={async () => {
          setCreating(true);
          await createWallet();
          setCreating(false);
        }}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
          "bg-primary text-white hover:bg-primary/90",
          className
        )}
      >
        <Zap size={16} />
        Create Trading Wallet
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface hover:bg-white/5 transition-colors",
          className
        )}
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
          <Zap size={12} className="text-white" />
        </div>
        <span className="text-sm font-medium text-white">
          {truncateAddress(turnkeyAddress)}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "text-muted-foreground transition-transform",
            showDropdown && "rotate-180"
          )}
        />
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 p-3 rounded-xl bg-surface border border-border shadow-xl z-50 space-y-3">
            {/* Phantom Wallet */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground px-2">
                Identity Wallet (Phantom)
              </span>
              <div
                onClick={() => handleCopy("phantom", phantomAddress!)}
                className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/5 cursor-pointer"
              >
                <code className="text-sm text-white font-mono">
                  {truncateAddress(phantomAddress!)}
                </code>
                {copied === "phantom" ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <Copy size={14} className="text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Turnkey Trading Wallet */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs text-muted-foreground">
                  Trading Wallet (One-Click)
                </span>
                <span className="text-xs font-medium text-green-400 flex items-center gap-1">
                  <Zap size={10} />
                  Active
                </span>
              </div>
              <div
                onClick={() => handleCopy("turnkey", turnkeyAddress)}
                className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/5 cursor-pointer"
              >
                <code className="text-sm text-white font-mono">
                  {truncateAddress(turnkeyAddress)}
                </code>
                {copied === "turnkey" ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <Copy size={14} className="text-muted-foreground" />
                )}
              </div>
              <div className="px-2 text-xs text-muted-foreground">
                Balance: {balance !== null ? `${balance.toFixed(4)} SOL` : "—"}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Links */}
            <a
              href={`https://solscan.io/account/${turnkeyAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors text-sm text-muted-foreground hover:text-white"
            >
              View on Solscan
              <ExternalLink size={14} />
            </a>

            <a
              href="/profile"
              onClick={() => setShowDropdown(false)}
              className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors text-sm text-muted-foreground hover:text-white"
            >
              Manage Wallets
              <Wallet size={14} />
            </a>

            <div className="h-px bg-border" />

            {/* Disconnect */}
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-red-500/10 transition-colors text-sm text-red-400"
            >
              Disconnect
              <LogOut size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
