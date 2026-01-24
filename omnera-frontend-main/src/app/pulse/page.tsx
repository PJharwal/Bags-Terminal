"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  PulseTokenData,
  TradeEvent,
  MigrationEvent,
  TokenStats,
} from "@/types/pulse";
import { PulseCard } from "@/components/pulse/PulseCard";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { config } from "@/config/env";

const SOL_PRICE = 140; // Hardcoded SOL/USD price - TODO: fetch from price oracle
const THROTTLE_INTERVAL = 500; // Throttle updates every 500ms
const MAX_TOKENS_PER_LIST = 30;

// Socket configuration - use local endpoint for testing
const SOCKET_URL = "https://backend.solshift.fun";

type SortDirection = "asc" | "desc" | null;

export default function PulsePage() {
  const [newTokens, setNewTokens] = useState<PulseTokenData[]>([]);
  const [soonTokens, setSoonTokens] = useState<PulseTokenData[]>([]);
  const [bondedTokens, setBondedTokens] = useState<PulseTokenData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [soonSortDirection, setSoonSortDirection] =
    useState<SortDirection>("desc");
  const socketRef = useRef<Socket | null>(null);

  // Refs for batching socket updates
  const pendingNewTokensRef = useRef<Map<string, PulseTokenData>>(new Map());
  const pendingSoonTokensRef = useRef<Map<string, PulseTokenData>>(new Map());
  const pendingBondedTokensRef = useRef<Map<string, PulseTokenData>>(new Map());
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFlushRef = useRef<number>(0);

  // Helper to calculate market cap from trade data
  const calculateMarketCap = (
    pricePerToken: string,
    totalSupply: string
  ): number => {
    const price = parseFloat(pricePerToken) || 0;
    const supply = parseFloat(totalSupply) || 1000000000; // Default 1B supply
    return price * supply * SOL_PRICE;
  };

  // Helper to process NewTokenEvent into PulseTokenData
  const processNewTokenEvent = (event: any): PulseTokenData => {
    // For new tokens, bonding curve starts at 0 and gets updated via trade events
    // The bonding_curve_percent comes from trade events, not from creation
    let bondingProgress = 0;

    // If we have real_sol_reserves info, we can calculate progress
    // For new tokens just created, progress is essentially 0
    if (event.is_migrated) {
      bondingProgress = 100;
    }

    // Handle logo_url - the field from the socket event
    const logoUrl = event.logo_url || event.image_uri || event.logo || "";

    return {
      mint: event.mint || "",
      name: event.name || "Unknown",
      symbol: event.symbol || "UNK",
      image_uri: logoUrl,
      logo: logoUrl,
      market_cap: 0, // Will be updated on first trade
      volume_24h: 0,
      tx_count: 0,
      price_change_1h: 0,
      price_change_5m: 0,
      created_at:
        (event.creation_timestamp || Math.floor(Date.now() / 1000)) * 1000,
      bonding_curve_progress: bondingProgress,
      is_bonded: event.is_migrated || false,
      holder_count: event.holder_count || 0,
      liquidity: 0,
      total_supply: event.total_supply || "1000000000",
      max_supply: event.max_supply || undefined,
      banner: event.banner_url || "",
      protocol_source: event.protocol_source || "unknown",
    };
  };

  // Helper to process raw API data (unified format) into PulseTokenData
  const processApiTokenData = (data: any, isBonded = false): PulseTokenData => {
    const marketCapSol = parseFloat(data.market_cap_sol || "0");
    const volume24hSol = parseFloat(data.volume_24h_sol || "0");
    const bondingProgress = isBonded
      ? 100
      : parseFloat(data.bonding_curve_percent || "0");

    return {
      mint: data.mint || "unknown",
      name: data.name || "Unknown",
      symbol: data.symbol || "UNK",
      image_uri: data.logo_url || "",
      logo: data.logo_url || "",
      market_cap: marketCapSol * SOL_PRICE,
      volume_24h: volume24hSol * SOL_PRICE,
      tx_count: data.total_transactions || 0,
      price_change_1h: 0,
      price_change_5m: 0,
      created_at: data.creation_timestamp
        ? data.creation_timestamp * 1000
        : Date.now(),
      bonding_curve_progress: bondingProgress,
      is_bonded: isBonded || data.is_migrated || false,
      holder_count: data.holder_count || 0,
      liquidity: 0,
      total_supply: data.total_supply || "1000000000",
      banner: "",
      protocol_source: data.protocol_source || "unknown",
    };
  };

  // Helper to update token from TradeEvent
  const processTradeUpdate = (
    trade: TradeEvent,
    existingToken: PulseTokenData
  ): PulseTokenData => {
    const bondingProgress = trade.bonding_curve_percent
      ? parseFloat(trade.bonding_curve_percent)
      : existingToken.bonding_curve_progress;

    // Calculate new market cap from price_per_token
    // price_per_token is in raw form, divide by 1000 to get SOL per token
    // Formula: price_sol_per_token = price_raw * (10^6 / 10^9) = price_raw / 1000
    let marketCap = existingToken.market_cap;
    if (trade.price_per_token) {
      const priceRaw = parseFloat(trade.price_per_token) || 0;
      const priceSolPerToken = priceRaw / 1000;

      // Handle total_supply - normalize if it's in raw format (with decimals)
      // If > 1e12, assume it's raw and divide by 1e6 (6 decimals)
      let totalSupplyRaw = parseFloat(
        existingToken.total_supply || "1000000000"
      );
      const totalSupply =
        totalSupplyRaw > 1e12 ? totalSupplyRaw / 1e6 : totalSupplyRaw;

      const marketCapSol = priceSolPerToken * totalSupply;
      marketCap =
        priceRaw > 0 ? marketCapSol * SOL_PRICE : existingToken.market_cap;

      // Sanity check: if market cap is unrealistically high (>$1B), keep existing
      if (marketCap > 1_000_000_000) {
        marketCap = existingToken.market_cap;
      }
    }

    // Use volume_total_sol from trade event (in lamports, convert to SOL then to USD)
    let volume = existingToken.volume_24h;
    if (trade.volume_total_sol) {
      const volumeSol = parseFloat(trade.volume_total_sol) / 1e9; // lamports to SOL
      const volumeUsd = volumeSol * SOL_PRICE;
      if (volumeUsd > 0 && volumeUsd < 1_000_000_000) {
        // Sanity check
        volume = volumeUsd;
      }
    }

    return {
      ...existingToken,
      market_cap: marketCap > 0 ? marketCap : existingToken.market_cap,
      bonding_curve_progress:
        bondingProgress ?? existingToken.bonding_curve_progress,
      tx_count: existingToken.tx_count + 1,
      volume_24h: volume,
    };
  };

  // Helper to update token from trade event
  const updateTokenFromTrade = (
    list: PulseTokenData[],
    trade: TradeEvent
  ): PulseTokenData[] => {
    const index = list.findIndex((t) => t.mint === trade.mint);
    if (index === -1) return list;

    const updated = [...list];
    updated[index] = processTradeUpdate(trade, updated[index]);
    return updated;
  };

  // Handle migration event - move token to bonded list
  const handleMigration = useCallback((migration: MigrationEvent) => {
    console.log(
      "Migration event:",
      migration.symbol,
      migration.mint,
      "->",
      migration.to_dex
    );

    // Calculate final market cap from migration event
    const finalMarketCap = migration.final_market_cap_sol
      ? parseFloat(migration.final_market_cap_sol) * SOL_PRICE
      : 0;

    // Calculate total volume from migration event (lamports -> SOL -> USD)
    const totalVolume = migration.total_volume_sol
      ? (parseFloat(migration.total_volume_sol) / 1e9) * SOL_PRICE
      : 0;

    // Track whether we found the token in existing lists
    let foundInLists = false;

    // Try to find token in soon tokens first
    setSoonTokens((prev) => {
      const token = prev.find((t) => t.mint === migration.mint);
      if (token) {
        foundInLists = true;
        // Create bonded token with migration data
        const bondedToken: PulseTokenData = {
          ...token,
          // Override with migration event data if available
          name: migration.name || token.name,
          symbol: migration.symbol || token.symbol,
          image_uri: migration.logo_url || token.image_uri,
          logo: migration.logo_url || token.logo,
          holder_count: migration.holder_count || token.holder_count,
          market_cap: finalMarketCap > 0 ? finalMarketCap : token.market_cap,
          volume_24h: totalVolume > 0 ? totalVolume : token.volume_24h,
          tx_count: migration.total_trades || token.tx_count,
          bonding_curve_progress: 100,
          is_bonded: true,
          protocol_source: migration.from_protocol,
        };
        setBondedTokens((bondedPrev) =>
          [bondedToken, ...bondedPrev].slice(0, MAX_TOKENS_PER_LIST)
        );
      }
      return prev.filter((t) => t.mint !== migration.mint);
    });

    // Also remove from new tokens (in case it was there)
    setNewTokens((prev) => {
      const token = prev.find((t) => t.mint === migration.mint);
      if (token) {
        foundInLists = true;
        // Create bonded token with migration data
        const bondedToken: PulseTokenData = {
          ...token,
          name: migration.name || token.name,
          symbol: migration.symbol || token.symbol,
          image_uri: migration.logo_url || token.image_uri,
          logo: migration.logo_url || token.logo,
          holder_count: migration.holder_count || token.holder_count,
          market_cap: finalMarketCap > 0 ? finalMarketCap : token.market_cap,
          volume_24h: totalVolume > 0 ? totalVolume : token.volume_24h,
          tx_count: migration.total_trades || token.tx_count,
          bonding_curve_progress: 100,
          is_bonded: true,
          protocol_source: migration.from_protocol,
        };
        // Only add if not already added from soonTokens
        setBondedTokens((bondedPrev) => {
          if (bondedPrev.some((t) => t.mint === migration.mint)) {
            return bondedPrev;
          }
          return [bondedToken, ...bondedPrev].slice(0, MAX_TOKENS_PER_LIST);
        });
      }
      return prev.filter((t) => t.mint !== migration.mint);
    });

    // If token wasn't found in any list, create a new bonded token directly from migration data
    // Use setTimeout to ensure state updates from above have been processed
    setTimeout(() => {
      setBondedTokens((bondedPrev) => {
        // Check if already added by the above state updates
        if (bondedPrev.some((t) => t.mint === migration.mint)) {
          return bondedPrev;
        }

        // Create new bonded token directly from migration event data
        const newBondedToken: PulseTokenData = {
          mint: migration.mint,
          name: migration.name || "Unknown",
          symbol: migration.symbol || "UNK",
          image_uri: migration.logo_url || "",
          logo: migration.logo_url || "",
          market_cap: finalMarketCap,
          volume_24h: totalVolume,
          tx_count: migration.total_trades || 0,
          price_change_1h: 0,
          price_change_5m: 0,
          created_at: migration.migrated_at
            ? migration.migrated_at * 1000
            : Date.now(),
          bonding_curve_progress: 100,
          is_bonded: true,
          holder_count: migration.holder_count || 0,
          liquidity: 0,
          protocol_source: migration.from_protocol,
        };

        console.log(
          "Created new bonded token from migration:",
          newBondedToken.symbol,
          newBondedToken.mint
        );
        return [newBondedToken, ...bondedPrev].slice(0, MAX_TOKENS_PER_LIST);
      });
    }, 0);
  }, []);

  // Flush pending updates to state (batched)
  const flushPendingUpdates = useCallback(() => {
    const now = Date.now();
    if (now - lastFlushRef.current < THROTTLE_INTERVAL) {
      // Schedule a flush after the throttle interval
      if (!throttleTimeoutRef.current) {
        throttleTimeoutRef.current = setTimeout(() => {
          throttleTimeoutRef.current = null;
          flushPendingUpdates();
        }, THROTTLE_INTERVAL - (now - lastFlushRef.current));
      }
      return;
    }

    lastFlushRef.current = now;

    // Flush new tokens
    if (pendingNewTokensRef.current.size > 0) {
      const pending = Array.from(pendingNewTokensRef.current.values());
      pendingNewTokensRef.current.clear();
      setNewTokens((prev) => {
        let updated = [...prev];
        for (const token of pending) {
          const index = updated.findIndex((t) => t.mint === token.mint);
          if (index !== -1) {
            updated[index] = {
              ...updated[index],
              ...token,
              stats: token.stats || updated[index].stats,
            };
          } else {
            updated = [token, ...updated];
          }
        }
        return updated.slice(0, MAX_TOKENS_PER_LIST);
      });
    }

    // Flush soon tokens
    if (pendingSoonTokensRef.current.size > 0) {
      const pending = Array.from(pendingSoonTokensRef.current.values());
      pendingSoonTokensRef.current.clear();
      setSoonTokens((prev) => {
        let updated = [...prev];
        for (const token of pending) {
          const index = updated.findIndex((t) => t.mint === token.mint);
          if (index !== -1) {
            updated[index] = {
              ...updated[index],
              ...token,
              stats: token.stats || updated[index].stats,
            };
          } else {
            updated = [token, ...updated];
          }
        }
        return updated.slice(0, MAX_TOKENS_PER_LIST);
      });
    }

    // Flush bonded tokens
    if (pendingBondedTokensRef.current.size > 0) {
      const pending = Array.from(pendingBondedTokensRef.current.values());
      pendingBondedTokensRef.current.clear();
      setBondedTokens((prev) => {
        let updated = [...prev];
        for (const token of pending) {
          const index = updated.findIndex((t) => t.mint === token.mint);
          if (index !== -1) {
            updated[index] = {
              ...updated[index],
              ...token,
              stats: token.stats || updated[index].stats,
            };
          } else {
            updated = [token, ...updated];
          }
        }
        return updated.slice(0, MAX_TOKENS_PER_LIST);
      });
    }
  }, []);

  // Queue token for batched update
  const queueTokenUpdate = useCallback(
    (type: "new" | "soon" | "bonded", token: PulseTokenData) => {
      const refMap = {
        new: pendingNewTokensRef,
        soon: pendingSoonTokensRef,
        bonded: pendingBondedTokensRef,
      };

      const existing = refMap[type].current.get(token.mint);
      if (existing) {
        // Merge with existing pending update
        refMap[type].current.set(token.mint, {
          ...existing,
          ...token,
          bonding_curve_progress:
            token.bonding_curve_progress ?? existing.bonding_curve_progress,
          stats: token.stats || existing.stats,
        });
      } else {
        refMap[type].current.set(token.mint, token);
      }

      // Schedule flush
      flushPendingUpdates();
    },
    [flushPendingUpdates]
  );

  // Sorted soon tokens (memoized)
  const sortedSoonTokens = useMemo(() => {
    if (!soonSortDirection) return soonTokens;
    return [...soonTokens].sort((a, b) => {
      const aProgress = a.bonding_curve_progress || 0;
      const bProgress = b.bonding_curve_progress || 0;
      return soonSortDirection === "asc"
        ? aProgress - bProgress
        : bProgress - aProgress;
    });
  }, [soonTokens, soonSortDirection]);

  // Toggle sort direction
  const toggleSoonSort = useCallback(() => {
    setSoonSortDirection((prev) => {
      if (prev === "desc") return "asc";
      if (prev === "asc") return null;
      return "desc";
    });
  }, []);

  // Helper to process new API format (graduating/migrated endpoints) into PulseTokenData
  const processNewApiTokenData = (
    data: any,
    isBonded = false
  ): PulseTokenData => {
    const bondingProgress = isBonded
      ? 100
      : parseFloat(data.bonding_curve_percent || "0");

    // Convert SOL values to USD using SOL_PRICE
    const marketCapSol = parseFloat(data.market_cap_sol || "0");
    const volume24hSol = parseFloat(data.volume_24h_sol || "0");

    return {
      mint: data.mint || "",
      name: data.name || "Unknown",
      symbol: data.symbol || "UNK",
      image_uri: data.logo_url || "",
      logo: data.logo_url || "",
      market_cap: marketCapSol * SOL_PRICE,
      volume_24h: volume24hSol * SOL_PRICE,
      tx_count: data.total_transactions || 0,
      price_change_1h: 0,
      price_change_5m: 0,
      created_at: data.creation_timestamp
        ? data.creation_timestamp * 1000
        : Date.now(),
      bonding_curve_progress: bondingProgress,
      is_bonded: isBonded || data.is_migrated || false,
      holder_count: data.holder_count || 0,
      liquidity: 0,
      total_supply: data.total_supply || "1000000000",
      max_supply: data.max_supply || undefined,
      banner: data.banner_url || "",
      protocol_source: data.protocol_source || "unknown",
    };
  };

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [newRes, soonRes, bondedRes] = await Promise.all([
          fetch(`${config.baseServerUrl}/api/tokens?limit=20`),
          fetch(`${config.baseServerUrl}/api/tokens?status=graduating&hours=6`),
          fetch(`${config.baseServerUrl}/api/tokens?status=migrated&limit=20`),
        ]);

        if (newRes.ok) {
          const data = await newRes.json();
          if (Array.isArray(data)) {
            setNewTokens(data.map((t: any) => processApiTokenData(t)));
          }
        }

        if (soonRes.ok) {
          const data = await soonRes.json();
          // New API format: { count, tokens: [...] }
          if (data.tokens && Array.isArray(data.tokens)) {
            setSoonTokens(
              data.tokens.map((t: any) => processNewApiTokenData(t, false))
            );
          } else if (Array.isArray(data)) {
            // Fallback for old format
            setSoonTokens(data.map((t: any) => processApiTokenData(t)));
          }
        }

        if (bondedRes.ok) {
          const data = await bondedRes.json();
          // New API format: { count, tokens: [...] }
          if (data.tokens && Array.isArray(data.tokens)) {
            setBondedTokens(
              data.tokens.map((t: any) => processNewApiTokenData(t, true))
            );
          } else if (Array.isArray(data)) {
            // Fallback for old format
            setBondedTokens(data.map((t: any) => processApiTokenData(t, true)));
          }
        }
      } catch (error) {
        console.error("Failed to fetch initial token data:", error);
      }
    };

    fetchInitialData();
  }, []);

  // Socket connection
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to Pulse socket:", socket.id);
      setIsConnected(true);

      // Subscribe to rooms
      socket.emit("subscribe", { room: "new_tokens:all" });
      socket.emit("subscribe", { room: "trades:all" });
      socket.emit("subscribe", { room: "migrations:all" });
      socket.emit("subscribe", { room: "metadata:all" });
      console.log(
        "Subscribed to new_tokens:all, trades:all, migrations:all, and metadata:all"
      );
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from Pulse socket");
      setIsConnected(false);
    });

    socket.on("subscribed", (data: { room: string }) => {
      console.log("Subscribed to room:", data.room);
    });

    // Handle new_token events
    socket.on("new_token", (payload: any) => {
      console.log("New token:", payload.symbol, payload.mint);
      const token = processNewTokenEvent(payload);

      // Determine which list based on bonding curve progress
      if (payload.is_migrated) {
        queueTokenUpdate("bonded", token);
      } else if (
        token.bonding_curve_progress &&
        token.bonding_curve_progress >= 50
      ) {
        queueTokenUpdate("soon", token);
      } else {
        queueTokenUpdate("new", token);
      }
    });

    // Handle trade events
    socket.on("trade", (trade: TradeEvent) => {
      // Update token in all lists
      setNewTokens((prev) => updateTokenFromTrade(prev, trade));
      setSoonTokens((prev) => updateTokenFromTrade(prev, trade));
      setBondedTokens((prev) => updateTokenFromTrade(prev, trade));

      // Check bonding curve progress and move tokens between columns
      if (trade.bonding_curve_percent) {
        const progress = parseFloat(trade.bonding_curve_percent);

        // If 100%, move to bonded
        if (progress >= 100) {
          // Move from new tokens to bonded
          setNewTokens((prev) => {
            const token = prev.find((t) => t.mint === trade.mint);
            if (token) {
              const bondedToken: PulseTokenData = {
                ...token,
                bonding_curve_progress: 100,
                is_bonded: true,
              };
              setBondedTokens((bondedPrev) => {
                if (bondedPrev.some((t) => t.mint === trade.mint))
                  return bondedPrev;
                return [bondedToken, ...bondedPrev].slice(
                  0,
                  MAX_TOKENS_PER_LIST
                );
              });
              return prev.filter((t) => t.mint !== trade.mint);
            }
            return prev;
          });

          // Move from soon tokens to bonded
          setSoonTokens((prev) => {
            const token = prev.find((t) => t.mint === trade.mint);
            if (token) {
              const bondedToken: PulseTokenData = {
                ...token,
                bonding_curve_progress: 100,
                is_bonded: true,
              };
              setBondedTokens((bondedPrev) => {
                if (bondedPrev.some((t) => t.mint === trade.mint))
                  return bondedPrev;
                return [bondedToken, ...bondedPrev].slice(
                  0,
                  MAX_TOKENS_PER_LIST
                );
              });
              return prev.filter((t) => t.mint !== trade.mint);
            }
            return prev;
          });
        }
        // If >= 50% but < 100%, move to soon
        else if (progress >= 50) {
          setNewTokens((prev) => {
            const token = prev.find((t) => t.mint === trade.mint);
            if (token) {
              const updatedToken = {
                ...token,
                bonding_curve_progress: progress,
              };
              queueTokenUpdate("soon", updatedToken);
              return prev.filter((t) => t.mint !== trade.mint);
            }
            return prev;
          });
        }
      }
    });

    // Handle migration events
    socket.on("migration", (migration: MigrationEvent) => {
      console.log("Token migrated:", migration.mint, "to", migration.to_dex);
      handleMigration(migration);
    });

    // Handle metadata_updated events - update token logos dynamically
    socket.on("metadata_updated", (payload: any) => {
      const mint = payload.address;
      const tokenInfo = payload.info?.data?.[0];

      if (!mint || !tokenInfo) return;

      const logo = tokenInfo.logo || "";
      const name = tokenInfo.name;
      const symbol = tokenInfo.symbol;
      const holderCount = tokenInfo.holder_count;

      // Only update if we have a logo (this is the primary use case)
      if (!logo) return;

      console.log("Metadata update for:", mint, "- logo:", logo ? "✓" : "✗");

      // Helper to update token metadata in a list
      const updateTokenMetadata = (
        prev: PulseTokenData[]
      ): PulseTokenData[] => {
        const index = prev.findIndex((t) => t.mint === mint);
        if (index === -1) return prev;

        const updated = [...prev];
        const token = updated[index];

        // Only update if current image is missing/empty
        const needsLogoUpdate = !token.image_uri && !token.logo;

        if (needsLogoUpdate || name || symbol || holderCount) {
          updated[index] = {
            ...token,
            image_uri: needsLogoUpdate ? logo : token.image_uri,
            logo: needsLogoUpdate ? logo : token.logo,
            name: name || token.name,
            symbol: symbol || token.symbol,
            holder_count: holderCount || token.holder_count,
          };
        }
        return updated;
      };

      // Update in all lists
      setNewTokens(updateTokenMetadata);
      setSoonTokens(updateTokenMetadata);
      setBondedTokens(updateTokenMetadata);
    });

    // Ping/pong for connection health
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit("ping");
      }
    }, 30000);

    socket.on("pong", (data: { time: number }) => {
      console.log("Pong received, server time:", data.time);
    });

    return () => {
      clearInterval(pingInterval);
      socket.disconnect();
    };
  }, [queueTokenUpdate, handleMigration]);

  const ColumnHeader = ({
    title,
    count,
    showSort,
    sortDirection,
    onSortClick,
  }: {
    title: string;
    count?: number;
    showSort?: boolean;
    sortDirection?: SortDirection;
    onSortClick?: () => void;
  }) => (
    <div className="flex items-center justify-between mb-4 px-2">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {count !== undefined && (
          <span className="text-xs font-mono bg-white/10 px-1.5 py-0.5 rounded text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {showSort && (
          <button
            onClick={onSortClick}
            className={`p-1.5 rounded border transition-colors flex items-center gap-1 text-xs ${sortDirection
              ? "bg-green-500/20 border-green-500/50 text-green-400"
              : "hover:bg-white/5 border-transparent hover:border-border text-muted-foreground"
              }`}
            title={`Sort by bonding curve % (${sortDirection === "desc"
              ? "High to Low"
              : sortDirection === "asc"
                ? "Low to High"
                : "None"
              })`}
          >
            {sortDirection === "desc" ? (
              <ChevronDown size={14} />
            ) : sortDirection === "asc" ? (
              <ChevronUp size={14} />
            ) : (
              <ArrowUpDown size={14} />
            )}
            <span className="hidden sm:inline">BC%</span>
          </button>
        )}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2 top-1.5 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search keyword"
            className="h-7 w-32 bg-surface border border-border rounded pl-7 pr-2 text-xs focus:outline-none focus:border-primary"
          />
        </div>
        <button className="p-1.5 hover:bg-white/5 rounded border border-transparent hover:border-border transition-colors">
          <SlidersHorizontal size={14} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          Pulse Dashboard
          <div
            className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"
              } animate-pulse`}
          />
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
        {/* New Tokens Column */}
        <div className="flex flex-col h-full bg-surface/20 rounded-xl border border-border/50 p-2">
          <ColumnHeader title="New" count={newTokens.length} />
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {newTokens.length === 0 ? (
              <div className="text-center text-muted-foreground py-10 text-sm">
                Waiting for new tokens...
              </div>
            ) : (
              newTokens.map((token, i) => (
                <PulseCard key={`${token.mint}-${i}`} data={token} type="new" />
              ))
            )}
          </div>
        </div>

        {/* Soon Tokens Column */}
        <div className="flex flex-col h-full bg-surface/20 rounded-xl border border-border/50 p-2">
          <ColumnHeader
            title="Soon"
            count={soonTokens.length}
            showSort={true}
            sortDirection={soonSortDirection}
            onSortClick={toggleSoonSort}
          />
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {sortedSoonTokens.length === 0 ? (
              <div className="text-center text-muted-foreground py-10 text-sm">
                Waiting for soon tokens...
              </div>
            ) : (
              sortedSoonTokens.map((token, i) => (
                <PulseCard
                  key={`${token.mint}-${i}`}
                  data={token}
                  type="soon"
                />
              ))
            )}
          </div>
        </div>

        {/* Bonded Tokens Column */}
        <div className="flex flex-col h-full bg-surface/20 rounded-xl border border-border/50 p-2">
          <ColumnHeader title="Bonded" count={bondedTokens.length} />
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {bondedTokens.length === 0 ? (
              <div className="text-center text-muted-foreground py-10 text-sm">
                Waiting for bonded tokens...
              </div>
            ) : (
              bondedTokens.map((token, i) => (
                <PulseCard
                  key={`${token.mint}-${i}`}
                  data={token}
                  type="bonded"
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
