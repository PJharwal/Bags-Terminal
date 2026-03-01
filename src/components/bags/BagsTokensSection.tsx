"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  Users,
  Percent,
  Loader2,
  Plus,
  X,
  ExternalLink,
  Award,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  bagsTokensService,
  type BagsTokenInfo,
  type BagsTokenWithFeeData,
} from "@/services/bags-tokens.service";
import type { BagsTokenCreator } from "@/lib/bags-types";

// Format SOL amount with proper precision
function formatSol(amount: number): string {
  if (amount === 0) return "0";
  if (amount < 0.0001) return amount.toFixed(8);
  if (amount < 0.01) return amount.toFixed(6);
  if (amount < 1) return amount.toFixed(4);
  if (amount < 1000) return amount.toFixed(2);
  return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

// Format USD amount
function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Creator card component
function CreatorCard({ creator }: { creator: BagsTokenCreator; index: number }) {
  const [copied, setCopied] = useState(false);
  const sharePercent = creator.royaltyBps / 100;

  const copyAddress = () => {
    navigator.clipboard.writeText(creator.wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-[#111] rounded border border-white/5">
      <div className="relative">
        {creator.pfp ? (
          <img
            src={creator.pfp}
            alt={creator.username}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700] font-bold">
            {creator.username?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}
        {creator.isCreator && (
          <div className="absolute -top-1 -right-1 bg-[#FFD700] rounded-full p-0.5" title="Creator">
            <Award size={8} className="text-black" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-white truncate">
            {creator.username || "Anonymous"}
          </span>
          {creator.provider && creator.providerUsername && (
            <a
              href={
                creator.provider === "twitter"
                  ? `https://twitter.com/${creator.providerUsername}`
                  : "#"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1DA1F2] hover:underline text-xs"
            >
              @{creator.providerUsername}
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-[#666] font-mono">
            {creator.wallet.slice(0, 4)}...{creator.wallet.slice(-4)}
          </span>
          <button
            onClick={copyAddress}
            className="text-[#666] hover:text-white transition-colors"
          >
            {copied ? <Check size={10} className="text-[#39FF14]" /> : <Copy size={10} />}
          </button>
        </div>
      </div>

      <div className="text-right">
        <div className="text-lg font-mono font-bold text-[#FFD700]">
          {sharePercent.toFixed(1)}%
        </div>
        <div className="text-[10px] text-[#666]">fee share</div>
      </div>
    </div>
  );
}

// Single BAGS token card with expanded view
function BagsTokenCard({ token }: { token: BagsTokenWithFeeData }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className="bg-[#0A0A0A] border border-[#FFD700]/30 rounded overflow-hidden"
    >
      {/* Main card */}
      <div
        className="p-4 cursor-pointer hover:bg-[#111] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4">
          {/* Token logo */}
          <div className="relative flex-shrink-0">
            {token.logo ? (
              <img
                src={token.logo}
                alt={token.symbol}
                className="w-14 h-14 rounded-full object-cover border-2 border-[#FFD700]/30"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700] font-bold text-xl border-2 border-[#FFD700]/30">
                {token.symbol?.charAt(0) || "?"}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-[#FFD700] rounded-full p-1">
              <Coins size={10} className="text-black" />
            </div>
          </div>

          {/* Token info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-white text-lg">${token.symbol}</span>
              <span className="text-[8px] bg-[#FFD700]/20 text-[#FFD700] px-1.5 py-0.5 rounded font-mono uppercase">
                BAGS
              </span>
            </div>
            <div className="text-sm text-[#888] truncate">{token.name}</div>
            <div className="text-[10px] text-[#666] font-mono mt-1">
              {token.mint.slice(0, 8)}...{token.mint.slice(-8)}
            </div>
          </div>

          {/* Expand toggle */}
          <button className="text-[#888] hover:text-white transition-colors p-1">
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {/* Fee stats row */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5">
          <div>
            <div className="text-[10px] text-[#888] uppercase tracking-wider mb-1 flex items-center gap-1">
              <Coins size={10} className="text-[#FFD700]" /> Lifetime Fees
            </div>
            <div className="text-xl font-mono font-bold text-[#FFD700]">
              {formatSol(token.lifetimeFees)} SOL
            </div>
            <div className="text-[10px] text-[#666]">{formatUsd(token.lifetimeFeesUsd)}</div>
          </div>

          <div>
            <div className="text-[10px] text-[#888] uppercase tracking-wider mb-1 flex items-center gap-1">
              <Users size={10} /> Fee Earners
            </div>
            <div className="text-xl font-mono font-bold text-white">{token.creators.length}</div>
            <div className="text-[10px] text-[#666]">creators</div>
          </div>

          <div>
            <div className="text-[10px] text-[#888] uppercase tracking-wider mb-1 flex items-center gap-1">
              <Percent size={10} /> Total Royalty
            </div>
            <div className="text-xl font-mono font-bold text-[#39FF14]">
              {(token.totalRoyaltyBps / 100).toFixed(1)}%
            </div>
            <div className="text-[10px] text-[#666]">of volume</div>
          </div>
        </div>

        {token.error && (
          <div className="mt-3 p-2 bg-[#FF003C]/10 border border-[#FF003C]/30 rounded text-[#FF003C] text-xs flex items-center gap-2">
            <AlertCircle size={12} />
            {token.error}
          </div>
        )}
      </div>

      {/* Expanded section with creators */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 overflow-hidden"
          >
            <div className="p-4 bg-[#080808]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-mono text-[#888] uppercase tracking-wider">
                  Fee Earners ({token.creators.length})
                </h4>
                <Link
                  href={`/terminal/${token.mint}`}
                  className="text-xs text-[#39FF14] hover:underline flex items-center gap-1"
                >
                  View Terminal <ExternalLink size={10} />
                </Link>
              </div>

              {token.creators.length > 0 ? (
                <div className="space-y-2">
                  {token.creators.map((creator, i) => (
                    <CreatorCard key={creator.wallet} creator={creator} index={i} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-[#666] text-sm">
                  No fee earners configured
                </div>
              )}

              {/* Claim stats if available */}
              {token.claimStats && token.claimStats.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <h5 className="text-xs font-mono text-[#888] uppercase tracking-wider mb-2">
                    Claim Statistics
                  </h5>
                  <div className="space-y-1">
                    {token.claimStats.map((stat) => (
                      <div
                        key={stat.wallet}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-[#888] font-mono">
                          {stat.username || `${stat.wallet.slice(0, 4)}...${stat.wallet.slice(-4)}`}
                        </span>
                        <span className="text-[#FFD700] font-mono font-bold">
                          {formatSol(parseFloat(stat.totalClaimed))} SOL claimed
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Add token modal
function AddTokenModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (token: BagsTokenInfo) => void;
}) {
  const [mint, setMint] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState("");
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    lifetimeFees?: number;
  } | null>(null);

  const validateAndAdd = async () => {
    if (!mint.trim()) {
      setError("Please enter a token mint address");
      return;
    }

    setIsValidating(true);
    setError("");
    setValidationResult(null);

    const result = await bagsTokensService.validateBagsToken(mint.trim());

    if (result.isValid) {
      setValidationResult({ isValid: true, lifetimeFees: result.lifetimeFees });
      onAdd({
        mint: mint.trim(),
        name: name.trim() || "Unknown Token",
        symbol: symbol.trim() || "???",
      });
      setMint("");
      setName("");
      setSymbol("");
      onClose();
    } else {
      setError(result.error || "Invalid BAGS token");
    }

    setIsValidating(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0A0A0A] border border-white/10 rounded-lg w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-mono font-bold">Add BAGS Token</h3>
          <button
            onClick={onClose}
            className="text-[#888] hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#888] uppercase tracking-wider mb-2">
              Token Mint Address *
            </label>
            <input
              type="text"
              value={mint}
              onChange={(e) => setMint(e.target.value)}
              placeholder="Enter Solana token mint address"
              className="w-full bg-[#111] border border-white/10 rounded px-3 py-2 text-white font-mono text-sm focus:border-[#FFD700] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#888] uppercase tracking-wider mb-2">
                Token Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., My Token"
                className="w-full bg-[#111] border border-white/10 rounded px-3 py-2 text-white font-mono text-sm focus:border-[#FFD700] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-[#888] uppercase tracking-wider mb-2">
                Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g., MTK"
                className="w-full bg-[#111] border border-white/10 rounded px-3 py-2 text-white font-mono text-sm focus:border-[#FFD700] focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-[#FF003C]/10 border border-[#FF003C]/30 rounded text-[#FF003C] text-sm flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {validationResult?.isValid && (
            <div className="p-3 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded text-[#39FF14] text-sm">
              Valid BAGS token! Lifetime fees: {formatSol(validationResult.lifetimeFees || 0)} SOL
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-white/10 text-[#888] hover:text-white hover:border-white/30 rounded transition-colors font-mono text-sm"
          >
            Cancel
          </button>
          <button
            onClick={validateAndAdd}
            disabled={isValidating || !mint.trim()}
            className="flex-1 px-4 py-2 bg-[#FFD700] text-black font-bold rounded hover:bg-[#FFD700]/90 transition-colors font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isValidating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <Plus size={14} />
                Add Token
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Main BAGS Tokens Section
export default function BagsTokensSection({ solPrice = 140 }: { solPrice?: number }) {
  const [tokens, setTokens] = useState<BagsTokenWithFeeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState("");

  const loadTokens = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError("");

    try {
      const data = await bagsTokensService.fetchAllBagsTokensFeeData(solPrice);
      setTokens(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load BAGS tokens");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [solPrice]);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  const handleAddToken = (token: BagsTokenInfo) => {
    bagsTokensService.addUserToken(token);
    loadTokens(true);
  };

  // Calculate totals
  const totalLifetimeFees = tokens.reduce((sum, t) => sum + t.lifetimeFees, 0);
  const totalCreators = tokens.reduce((sum, t) => sum + t.creators.length, 0);

  return (
    <div className="bg-[#050505] border border-[#FFD700]/20 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#FFD700]/20 bg-gradient-to-r from-[#FFD700]/10 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFD700]/20 rounded">
              <Coins className="text-[#FFD700]" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-mono flex items-center gap-2">
                BAGS Fee-Sharing Tokens
                <span className="text-[10px] bg-[#FFD700] text-black px-2 py-0.5 rounded font-bold">
                  LIVE DATA
                </span>
              </h2>
              <p className="text-sm text-[#888]">
                Tokens deployed on bags.fm with real-time fee earnings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadTokens(true)}
              disabled={isRefreshing}
              className="p-2 border border-white/10 rounded hover:border-[#FFD700] hover:text-[#FFD700] transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#FFD700] text-black font-bold rounded hover:bg-[#FFD700]/90 transition-colors font-mono text-sm flex items-center gap-2"
            >
              <Plus size={14} />
              Add Token
            </button>
          </div>
        </div>

        {/* Stats summary */}
        {tokens.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-[#0A0A0A] rounded p-3">
              <div className="text-[10px] text-[#888] uppercase tracking-wider">Tokens Tracked</div>
              <div className="text-2xl font-mono font-bold text-white">{tokens.length}</div>
            </div>
            <div className="bg-[#0A0A0A] rounded p-3">
              <div className="text-[10px] text-[#888] uppercase tracking-wider">Total Fees Earned</div>
              <div className="text-2xl font-mono font-bold text-[#FFD700]">
                {formatSol(totalLifetimeFees)} SOL
              </div>
            </div>
            <div className="bg-[#0A0A0A] rounded p-3">
              <div className="text-[10px] text-[#888] uppercase tracking-wider">Total Creators</div>
              <div className="text-2xl font-mono font-bold text-white">{totalCreators}</div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-[#FFD700] mr-3" />
            <span className="text-[#888]">Loading BAGS tokens...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle size={32} className="mx-auto mb-4 text-[#FF003C] opacity-50" />
            <p className="text-[#FF003C]">{error}</p>
            <button
              onClick={() => loadTokens()}
              className="mt-4 px-4 py-2 border border-white/10 rounded hover:border-white/30 text-sm"
            >
              Try Again
            </button>
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-12">
            <Coins size={32} className="mx-auto mb-4 text-[#FFD700] opacity-30" />
            <p className="text-[#888] mb-4">No BAGS tokens added yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#FFD700] text-black font-bold rounded hover:bg-[#FFD700]/90 transition-colors font-mono text-sm"
            >
              Add Your First Token
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tokens.map((token) => (
              <BagsTokenCard key={token.mint} token={token} />
            ))}
          </div>
        )}
      </div>

      {/* Add Token Modal */}
      <AddTokenModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddToken}
      />
    </div>
  );
}
