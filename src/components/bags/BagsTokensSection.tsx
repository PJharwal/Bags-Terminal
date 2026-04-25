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
  ExternalLink,
  Award,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import { BagsLogo } from "@/components/ui/BagsLogo";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { AddressInput } from "@/components/ui/AddressInput";
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

  const copyAddress = async () => {
    await navigator.clipboard.writeText(creator.wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3 p-3 stat-card">
      <div className="relative">
        {creator.pfp ? (
          <img
            src={creator.pfp}
            alt={creator.username}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-gold font-bold">
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
          <span className="text-meta text-muted-high font-mono">
            {creator.wallet.slice(0, 4)}...{creator.wallet.slice(-4)}
          </span>
          <button
            onClick={copyAddress}
            className="text-muted-high hover:text-white transition-colors"
          >
            {copied ? <Check size={10} className="text-acid-green" /> : <Copy size={10} />}
          </button>
        </div>
      </div>

      <div className="text-right">
        <div className="text-lg font-mono font-bold text-gold">
          {sharePercent.toFixed(1)}%
        </div>
        <div className="text-meta text-muted-high">fee share</div>
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
      className="card card-gold overflow-hidden"
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
              <div className="w-14 h-14 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-gold font-bold text-xl border-2 border-[#FFD700]/30">
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
              <span className="text-meta bg-[#FFD700]/20 text-gold px-1.5 py-0.5 rounded font-mono uppercase">
                BAGS
              </span>
            </div>
            <div className="text-sm text-fg-soft truncate">{token.name}</div>
            <div className="text-meta text-muted-high font-mono mt-1">
              {token.mint.slice(0, 8)}...{token.mint.slice(-8)}
            </div>
          </div>

          {/* Expand toggle */}
          <button className="text-fg-soft hover:text-white transition-colors p-1">
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {/* Fee stats row */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5">
          <div>
            <div className="text-meta text-fg-soft uppercase tracking-wider mb-1 flex items-center gap-1">
              <Coins size={10} className="text-gold" /> Lifetime Fees
            </div>
            <div className="text-xl font-mono font-bold text-gold">
              {formatSol(token.lifetimeFees)} SOL
            </div>
            <div className="text-meta text-muted-high">{formatUsd(token.lifetimeFeesUsd)}</div>
          </div>

          <div>
            <div className="text-meta text-fg-soft uppercase tracking-wider mb-1 flex items-center gap-1">
              <Users size={10} /> Fee Earners
            </div>
            <div className="text-xl font-mono font-bold text-white">{token.creators.length}</div>
            <div className="text-meta text-muted-high">creators</div>
          </div>

          <div>
            <div className="text-meta text-fg-soft uppercase tracking-wider mb-1 flex items-center gap-1">
              <Percent size={10} /> Total Royalty
            </div>
            <div className="text-xl font-mono font-bold text-acid-green">
              {(token.totalRoyaltyBps / 100).toFixed(1)}%
            </div>
            <div className="text-meta text-muted-high">of volume</div>
          </div>
        </div>

        {token.error && (
          <div className="mt-3 p-2 bg-[#FF003C]/10 border border-[#FF003C]/30 rounded text-error text-xs flex items-center gap-2">
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
                <h4 className="text-sm font-mono text-fg-soft uppercase tracking-wider">
                  Fee Earners ({token.creators.length})
                </h4>
                <Link
                  href={`/terminal/${token.mint}`}
                  className="text-xs text-acid-green hover:underline flex items-center gap-1"
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
                <div className="text-center py-4 text-muted-high text-sm">
                  No fee earners configured
                </div>
              )}

              {/* Claim stats if available */}
              {token.claimStats && token.claimStats.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <h5 className="text-xs font-mono text-fg-soft uppercase tracking-wider mb-2">
                    Claim Statistics
                  </h5>
                  <div className="space-y-1">
                    {token.claimStats.map((stat) => (
                      <div
                        key={stat.wallet}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-fg-soft font-mono">
                          {stat.username || `${stat.wallet.slice(0, 4)}...${stat.wallet.slice(-4)}`}
                        </span>
                        <span className="text-gold font-mono font-bold">
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
  const [mintError, setMintError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    lifetimeFees?: number;
  } | null>(null);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setMint("");
      setName("");
      setSymbol("");
      setMintError(null);
      setGlobalError(null);
      setValidationResult(null);
      setIsValidating(false);
    }
  }, [isOpen]);

  const validateAndAdd = async () => {
    setMintError(null);
    setGlobalError(null);
    if (!mint.trim()) {
      setMintError("Token mint address is required");
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await bagsTokensService.validateBagsToken(mint.trim());

      if (result.isValid) {
        setValidationResult({ isValid: true, lifetimeFees: result.lifetimeFees });
        onAdd({
          mint: mint.trim(),
          name: name.trim() || "Unknown Token",
          symbol: symbol.trim() || "???",
        });
        onClose();
      } else {
        setGlobalError(result.error || "Invalid BAGS token");
      }
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="!max-w-md p-6">
        <div className="mb-6">
          <DialogTitle>Add BAGS Token</DialogTitle>
        </div>
        <DialogDescription className="sr-only">
          Add and validate a BAGS fee-sharing token by mint address.
        </DialogDescription>

        <div className="space-y-4">
          <Field label="Token Mint Address" required error={mintError ?? undefined}>
            <AddressInput
              value={mint}
              onChange={(e) => setMint(e.target.value)}
              placeholder="Enter Solana token mint address"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Token Name">
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., My Token"
              />
            </Field>
            <Field label="Symbol">
              <Input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g., MTK"
              />
            </Field>
          </div>

          {globalError && (
            <div role="alert" className="p-3 bg-error/10 border border-error/30 text-error text-sm flex items-center gap-2">
              <AlertCircle size={14} aria-hidden="true" />
              {globalError}
            </div>
          )}

          {validationResult?.isValid && (
            <div role="status" className="p-3 bg-acid-green/10 border border-acid-green/30 text-acid-green text-sm">
              Valid BAGS token! Lifetime fees: {formatSol(validationResult.lifetimeFees || 0)} SOL
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <DialogClose asChild>
            <Button variant="ghost" size="md" fullWidth>Cancel</Button>
          </DialogClose>
          <Button
            variant="gold"
            size="md"
            fullWidth
            loading={isValidating}
            disabled={!mint.trim()}
            onClick={validateAndAdd}
            iconLeft={!isValidating ? <Plus size={14} /> : undefined}
          >
            {isValidating ? "Validating..." : "Add Token"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
    <div className="bg-[#050505] border border-[#FFD700]/15 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#FFD700]/10 bg-gradient-to-r from-[#FFD700]/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BagsLogo size={28} />
            <div>
              <h2 className="text-xl font-bold font-mono flex items-center gap-2">
                BAGS Fee-Sharing Tokens
                <span className="text-meta bg-[#FFD700] text-black px-2 py-0.5 rounded font-bold">
                  LIVE DATA
                </span>
              </h2>
              <p className="text-sm text-fg-soft">
                Tokens deployed on bags.fm with real-time fee earnings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="md"
              loading={isRefreshing}
              onClick={() => loadTokens(true)}
              aria-label="Refresh BAGS tokens"
              iconLeft={!isRefreshing ? <RefreshCw size={16} /> : undefined}
            />
            <Button
              variant="gold"
              size="md"
              onClick={() => setShowAddModal(true)}
              iconLeft={<Plus size={14} />}
            >
              Add Token
            </Button>
          </div>
        </div>

        {/* Stats summary */}
        {tokens.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="stat-card p-3">
              <div className="label">Tokens Tracked</div>
              <div className="text-2xl font-mono font-bold text-white">{tokens.length}</div>
            </div>
            <div className="stat-card p-3">
              <div className="label label-gold">Total Fees Earned</div>
              <div className="text-2xl font-mono font-bold text-gold">
                {formatSol(totalLifetimeFees)} SOL
              </div>
            </div>
            <div className="stat-card p-3">
              <div className="label">Total Creators</div>
              <div className="text-2xl font-mono font-bold text-white">{totalCreators}</div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-gold mr-3" />
            <span className="text-fg-soft">Loading BAGS tokens...</span>
          </div>
        ) : error ? (
          <div role="alert" className="text-center py-12">
            <AlertCircle size={32} aria-hidden="true" className="mx-auto mb-4 text-error opacity-50" />
            <p className="text-error">{error}</p>
            <div className="mt-4 inline-flex">
              <Button variant="ghost" size="sm" onClick={() => loadTokens()}>Try Again</Button>
            </div>
          </div>
        ) : tokens.length === 0 ? (
          <div role="status" className="text-center py-12">
            <Coins size={32} aria-hidden="true" className="mx-auto mb-4 text-gold opacity-30" />
            <p className="text-fg-soft mb-4">No BAGS tokens added yet</p>
            <div className="inline-flex">
              <Button variant="gold" size="md" onClick={() => setShowAddModal(true)}>Add Your First Token</Button>
            </div>
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
