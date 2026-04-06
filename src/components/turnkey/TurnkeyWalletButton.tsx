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
        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#888] bg-[#1A1A1A] border border-white/10 hover:border-[#39FF14] hover:text-[#39FF14] transition-all ${className || ""}`}
      >
        <Wallet size={14} />
        Connect Wallet
      </button>
    );
  }

  if (isLoading || creating) {
    return (
      <button
        className={`flex items-center gap-2 px-4 py-2 text-xs font-mono text-[#666] bg-[#1A1A1A] border border-white/10 ${className || ""}`}
        disabled
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        {creating ? "Creating..." : "Loading..."}
      </button>
    );
  }

  // Connected but no Turnkey wallet yet
  if (!isAuthenticated || !turnkeyAddress) {
    return (
      <button
        onClick={async () => {
          setCreating(true);
          await createWallet();
          setCreating(false);
        }}
        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-black bg-[#39FF14] hover:brightness-110 transition-all ${className || ""}`}
      >
        <Zap size={14} />
        Create Trading Wallet
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center gap-2 px-3 py-2 bg-[#1A1A1A] border border-white/10 hover:border-white/20 transition-colors ${className || ""}`}
      >
        <Zap size={12} className="text-[#39FF14]" />
        <span className="text-xs font-mono text-[#EDEDED]">
          {truncateAddress(turnkeyAddress)}
        </span>
        <ChevronDown
          size={12}
          className={`text-[#666] transition-transform ${showDropdown ? "rotate-180" : ""}`}
        />
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-72 p-3 bg-[#0A0A0A] border border-white/10 z-50 space-y-3">
            {/* Phantom Wallet */}
            <div className="space-y-1">
              <span className="text-[9px] text-[#666] uppercase tracking-widest px-2">
                Identity (Phantom)
              </span>
              <div
                onClick={() => handleCopy("phantom", phantomAddress!)}
                className="flex items-center justify-between px-2 py-1.5 hover:bg-white/5 cursor-pointer"
              >
                <code className="text-xs text-[#EDEDED] font-mono">
                  {truncateAddress(phantomAddress!)}
                </code>
                {copied === "phantom" ? (
                  <Check size={12} className="text-[#39FF14]" />
                ) : (
                  <Copy size={12} className="text-[#666]" />
                )}
              </div>
            </div>

            <div className="h-px bg-white/10" />

            {/* Turnkey Trading Wallet */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2">
                <span className="text-[9px] text-[#666] uppercase tracking-widest">
                  Trading Wallet
                </span>
                <span className="text-[9px] font-mono text-[#39FF14] flex items-center gap-1">
                  <Zap size={8} />
                  Active
                </span>
              </div>
              <div
                onClick={() => handleCopy("turnkey", turnkeyAddress)}
                className="flex items-center justify-between px-2 py-1.5 hover:bg-white/5 cursor-pointer"
              >
                <code className="text-xs text-[#EDEDED] font-mono">
                  {truncateAddress(turnkeyAddress)}
                </code>
                {copied === "turnkey" ? (
                  <Check size={12} className="text-[#39FF14]" />
                ) : (
                  <Copy size={12} className="text-[#666]" />
                )}
              </div>
              <div className="px-2 text-[10px] text-[#666] font-mono">
                Balance: {balance !== null ? `${balance.toFixed(4)} SOL` : "--"}
              </div>
            </div>

            <div className="h-px bg-white/10" />

            {/* Links */}
            <a
              href={`https://solscan.io/account/${turnkeyAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2 py-1.5 hover:bg-white/5 transition-colors text-[10px] text-[#888] hover:text-[#EDEDED]"
            >
              View on Solscan
              <ExternalLink size={12} />
            </a>

            <div className="h-px bg-white/10" />

            {/* Disconnect */}
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-[#FF003C]/10 transition-colors text-[10px] text-[#FF003C]"
            >
              Disconnect
              <LogOut size={12} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
