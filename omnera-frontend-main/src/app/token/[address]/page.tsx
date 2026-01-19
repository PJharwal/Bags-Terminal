"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  TokenInfoResponse,
  SecurityResponse,
  TraderData,
  HolderData,
  HoldersResponse,
  TokenStatsData,
} from "@/types/token";
import { SecurityCard } from "@/components/token/SecurityCard";
import { TradersTable } from "@/components/token/TradersTable";
import { HoldersTable } from "@/components/token/HoldersTable";
import { TokenAudit } from "@/components/token/TokenAudit";
import { TokenTrading } from "@/components/token/TokenTrading";
import { BirdeyeChart } from "@/components/token/BirdeyeChart";
import { ArrowLeft, Copy, ExternalLink, Globe, Twitter } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { config } from "@/config/env";

export default function TokenDetailPage() {
  const params = useParams();
  const address = params.address as string;

  const [info, setInfo] = useState<TokenInfoResponse | null>(null);
  const [security, setSecurity] = useState<SecurityResponse | null>(null);
  const [traders, setTraders] = useState<TraderData[]>([]);
  const [holders, setHolders] = useState<HolderData[]>([]);
  const [enrichedStats, setEnrichedStats] = useState<TokenStatsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "traders" | "holders"
  >("overview");

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [infoRes, securityRes, tradersRes, holdersRes, enrichedRes] =
          await Promise.all([
            fetch(`${config.baseGmgnUrl}/token/${address}/info`),
            fetch(`${config.baseGmgnUrl}/token/${address}/security`),
            fetch(`${config.baseGmgnUrl}/token/${address}/traders`),
            fetch(`${config.baseGmgnUrl}/token/${address}/holders`),
            fetch(`${config.baseGmgnUrl}/token/${address}/enriched?chain=sol`),
          ]);

        if (infoRes.ok) setInfo(await infoRes.json());
        if (securityRes.ok) setSecurity(await securityRes.json());
        if (tradersRes.ok) setTraders(await tradersRes.json());
        if (holdersRes.ok) {
          const holdersData: HoldersResponse = await holdersRes.json();
          setHolders(holdersData.list || []);
        }
        if (enrichedRes.ok) {
          const enrichedData = await enrichedRes.json();
          if (enrichedData.stats?.data) {
            setEnrichedStats(enrichedData.stats.data);
          }
        }
      } catch (error) {
        console.error("Error fetching token data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchAllData();
    }
  }, [address]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!info || !info.data || info.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold text-white">Token Not Found</h1>
        <Link href="/trending" className="text-primary hover:underline">
          Back to Trending
        </Link>
      </div>
    );
  }

  const token = info.data[0];

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto px-4">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/trending"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back to Trending
        </Link>

        <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
          <div className="flex items-start gap-4">
            <img
              src={token.logo || "/placeholder.png"}
              alt={token.name}
              className="w-14 h-14 rounded-full bg-surface border border-border object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/64x64/1e1e1e/FFF?text=" +
                  token.symbol[0];
              }}
            />
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                {token.name}
                <span className="text-base text-muted-foreground font-normal">
                  ({token.symbol})
                </span>
              </h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span className="font-mono bg-surface px-2 py-0.5 rounded border border-border flex items-center gap-2 text-xs">
                  {address.slice(0, 6)}...{address.slice(-4)}
                  <Copy size={12} className="cursor-pointer hover:text-white" />
                </span>
                {security?.launchpad && (
                  <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 text-xs">
                    {security.launchpad.launchpad}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            <div className="text-2xl font-mono font-bold text-white">
              ${parseFloat(token.price.price).toFixed(6)}
            </div>
            <div
              className={cn(
                "text-sm font-medium flex items-center gap-1",
                parseFloat(token.price.price_24h) >= 0
                  ? "text-green-500"
                  : "text-red-500"
              )}
            >
              {parseFloat(token.price.price_24h) >= 0 ? "+" : ""}
              {parseFloat(token.price.price_24h).toFixed(2)}% (24h)
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Chart + Trading Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Left/Main Area: Chart and Info */}
        <div className="space-y-6 min-w-0">
          {/* Birdeye Chart */}
          <BirdeyeChart tokenMint={address} />

          {/* Market Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-surface/50 backdrop-blur-sm p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Market Cap
              </div>
              <div className="text-lg font-mono font-semibold text-white">
                ${parseInt(token.market_cap || "0").toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface/50 backdrop-blur-sm p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Liquidity
              </div>
              <div className="text-lg font-mono font-semibold text-white">
                ${parseInt(token.liquidity).toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface/50 backdrop-blur-sm p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Volume (24h)
              </div>
              <div className="text-lg font-mono font-semibold text-white">
                ${parseInt(token.price.volume_24h).toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface/50 backdrop-blur-sm p-4">
              <div className="text-xs text-muted-foreground mb-1">Holders</div>
              <div className="text-lg font-mono font-semibold text-white">
                {token.holder_count.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="rounded-xl border border-border bg-surface/50 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center gap-4 border-b border-border px-4">
              <button
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "px-3 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                  activeTab === "overview"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-white"
                )}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("traders")}
                className={cn(
                  "px-3 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                  activeTab === "traders"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-white"
                )}
              >
                Top Traders
              </button>
              <button
                onClick={() => setActiveTab("holders")}
                className={cn(
                  "px-3 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                  activeTab === "holders"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-white"
                )}
              >
                Holders
              </button>
            </div>

            <div className="p-4 min-h-[300px]">
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Security */}
                  {security && <SecurityCard data={security.security} />}

                  {/* Token Audit */}
                  <TokenAudit stats={enrichedStats} />

                  {/* About Section */}
                  <div className="md:col-span-2 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
                    <h3 className="text-lg font-bold text-white mb-2">
                      About {token.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Token created on{" "}
                      {new Date(
                        token.creation_timestamp * 1000
                      ).toLocaleDateString()}
                      .
                      {security?.launchpad &&
                        ` Launched on ${security.launchpad.launchpad}.`}
                    </p>
                    <div className="flex gap-3 mt-3">
                      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-white/5 transition-colors text-xs">
                        <Globe size={14} /> Website
                      </button>
                      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-white/5 transition-colors text-xs">
                        <Twitter size={14} /> Twitter
                      </button>
                      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-white/5 transition-colors text-xs">
                        <ExternalLink size={14} /> Solscan
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "traders" && <TradersTable data={traders} />}

              {activeTab === "holders" && <HoldersTable data={holders} />}
            </div>
          </div>
        </div>

        {/* Right Column: Trading Panel */}
        <div className="xl:sticky xl:top-4 xl:self-start">
          <TokenTrading tokenMint={address} tokenSymbol={token.symbol} />
        </div>
      </div>
    </div>
  );
}
