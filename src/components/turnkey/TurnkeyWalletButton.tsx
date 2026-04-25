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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/Popover";
import { LiveDot } from "@/components/ui/LiveDot";

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
        type="button"
        onClick={() => setVisible(true)}
        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-fg-soft bg-elevated border border-default hover:border-acid-green hover:text-acid-green transition-all focus-ring ${className || ""}`}
      >
        <Wallet size={14} aria-hidden="true" />
        Connect Wallet
      </button>
    );
  }

  if (isLoading || creating) {
    return (
      <button
        type="button"
        className={`flex items-center gap-2 px-4 py-2 text-xs font-mono text-muted-high bg-elevated border border-default ${className || ""}`}
        disabled
        aria-busy="true"
      >
        <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
        {creating ? "Creating..." : "Loading..."}
      </button>
    );
  }

  // Connected but no Turnkey wallet yet
  if (!isAuthenticated || !turnkeyAddress) {
    return (
      <button
        type="button"
        onClick={async () => {
          setCreating(true);
          await createWallet();
          setCreating(false);
        }}
        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-black bg-acid-green hover:brightness-110 transition-all focus-ring ${className || ""}`}
      >
        <Zap size={14} aria-hidden="true" />
        Create Trading Wallet
      </button>
    );
  }

  return (
    <Popover open={showDropdown} onOpenChange={setShowDropdown}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Wallet menu for ${truncateAddress(turnkeyAddress)}`}
          className={`flex items-center gap-2 px-3 py-2 bg-elevated border border-default hover:border-strong transition-colors focus-ring ${className || ""}`}
        >
          <Zap size={12} aria-hidden="true" className="text-acid-green" />
          <span className="text-xs font-mono text-fg num">
            {truncateAddress(turnkeyAddress)}
          </span>
          <ChevronDown
            size={12}
            aria-hidden="true"
            className={`text-muted-high transition-transform ${showDropdown ? "rotate-180" : ""}`}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={4} className="w-72 p-3 space-y-3">
        {/* Phantom Wallet */}
        <div className="space-y-1">
          <span className="text-meta text-muted-high uppercase tracking-widest px-2 block">
            Identity (Phantom)
          </span>
          <button
            type="button"
            onClick={() => handleCopy("phantom", phantomAddress!)}
            aria-label="Copy Phantom wallet address"
            className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-white/5 focus-ring text-left"
          >
            <code className="text-xs text-fg font-mono num">
              {truncateAddress(phantomAddress!)}
            </code>
            {copied === "phantom" ? (
              <Check size={12} aria-hidden="true" className="text-acid-green" />
            ) : (
              <Copy size={12} aria-hidden="true" className="text-muted-high" />
            )}
          </button>
        </div>

        <div className="h-px bg-white/10" />

        {/* Turnkey Trading Wallet */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2">
            <span className="text-meta text-muted-high uppercase tracking-widest">
              Trading Wallet
            </span>
            <LiveDot status="live" size="xs" label="Active" />
          </div>
          <button
            type="button"
            onClick={() => handleCopy("turnkey", turnkeyAddress)}
            aria-label="Copy trading wallet address"
            className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-white/5 focus-ring text-left"
          >
            <code className="text-xs text-fg font-mono num">
              {truncateAddress(turnkeyAddress)}
            </code>
            {copied === "turnkey" ? (
              <Check size={12} aria-hidden="true" className="text-acid-green" />
            ) : (
              <Copy size={12} aria-hidden="true" className="text-muted-high" />
            )}
          </button>
          <div className="px-2 text-meta text-muted-high font-mono num">
            Balance: {balance !== null ? `${balance.toFixed(4)} SOL` : "--"}
          </div>
        </div>

        <div className="h-px bg-white/10" />

        {/* Links */}
        <a
          href={`https://solscan.io/account/${turnkeyAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-2 py-1.5 hover:bg-white/5 transition-colors text-meta text-fg-soft hover:text-fg focus-ring"
        >
          View on Solscan
          <ExternalLink size={12} aria-hidden="true" />
        </a>

        <div className="h-px bg-white/10" />

        {/* Disconnect */}
        <button
          type="button"
          onClick={handleDisconnect}
          className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-error/10 transition-colors text-meta text-error focus-ring"
        >
          Disconnect
          <LogOut size={12} aria-hidden="true" />
        </button>
      </PopoverContent>
    </Popover>
  );
};
