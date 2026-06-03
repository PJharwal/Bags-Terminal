import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { config } from '@/config/env';
import { NewTokenEvent, TradeEvent, MigrationEvent, MetadataEvent, SocketRoom } from '@/types/socket';
import { usePulseStore } from './pulse.store';
import { SOL_MINT_ADDRESS } from '@/lib/constants';

// BAGS token filter - only tokens with CA ending in 'bags'
const isBagsToken = (mint: string): boolean => {
  return mint.toLowerCase().endsWith('bags');
};

// Store ping interval ID for cleanup
let pingIntervalId: ReturnType<typeof setInterval> | null = null;

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  latestTokens: NewTokenEvent[];
  latestTrades: TradeEvent[];
  // Filtered BAGS-only arrays
  bagsTokens: NewTokenEvent[];
  bagsTrades: TradeEvent[];

  // Liveness signals — distinguish "socket connected" from "data actually flowing".
  lastEventAt: number;   // last time a real socket event (token/trade/migration) arrived
  lastFeedOkAt: number;  // last time a REST poll succeeded

  // Actions
  connect: () => void;
  disconnect: () => void;
  subscribe: (room: SocketRoom) => void;
  unsubscribe: (room: SocketRoom) => void;
  markFeedOk: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  latestTokens: [],
  latestTrades: [],
  bagsTokens: [],
  bagsTrades: [],
  lastEventAt: 0,
  lastFeedOkAt: 0,

  connect: () => {
    const { socket } = get();
    if (socket) return;

    const newSocket = io(config.baseServerUrl, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      set({ isConnected: true });

      // Sync with pulse store
      usePulseStore.getState().setConnected(true);

      // Subscribe to all token/trade rooms
      get().subscribe('new_tokens:all');
      get().subscribe('trades:all');
      get().subscribe('migrations:all');
      get().subscribe('metadata:all');
    });

    newSocket.on('disconnect', () => {
      set({ isConnected: false });

      // Sync with pulse store
      usePulseStore.getState().setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    newSocket.on('subscribed', (_data: { room: string }) => {
    });

    // Handle new token events
    newSocket.on('new_token', (token: NewTokenEvent) => {
      // Add to all tokens
      set((state) => ({
        latestTokens: [token, ...state.latestTokens].slice(0, 50),
        lastEventAt: Date.now(),
      }));

      // Track BAGS tokens separately (CA ends with 'bags')
      if (isBagsToken(token.mint)) {
        set((state) => ({
          bagsTokens: [token, ...state.bagsTokens].slice(0, 50)
        }));
      }

      // Add ALL tokens to pulse store for UI display
      // Fee data will be fetched for tokens that support it
      usePulseStore.getState().addTokenFromSocket(token);
    });

    // Handle trade events
    newSocket.on('trade', (trade: TradeEvent) => {
      // Drop wrapped-SOL "trades" — they are quote-side noise (mint = wSOL),
      // ~75% of the firehose, and never correspond to a real token card.
      if (trade.mint === SOL_MINT_ADDRESS) return;

      // Add to all trades
      set((state) => ({
        latestTrades: [trade, ...state.latestTrades].slice(0, 100),
        lastEventAt: Date.now(),
      }));

      // Track BAGS token trades separately
      if (isBagsToken(trade.mint)) {
        set((state) => ({
          bagsTrades: [trade, ...state.bagsTrades].slice(0, 100)
        }));
      }

      // Queue for the pulse store — updates are coalesced per animation frame
      // so a 250+/s firehose becomes at most ~60 store writes/s.
      usePulseStore.getState().queueTrade(trade);
    });

    // Handle migration events
    newSocket.on('migration', (migration: MigrationEvent) => {
      // Update pulse store - transition to MIGRATED state for all tokens
      set({ lastEventAt: Date.now() });
      usePulseStore.getState().transitionItem(migration.mint, 'MIGRATED');
    });

    // Handle metadata updates — backfills logos (and name/holders) for tokens
    // that were created before their off-chain metadata was indexed.
    newSocket.on('metadata_updated', (meta: MetadataEvent) => {
      set({ lastEventAt: Date.now() });
      usePulseStore.getState().applyMetadata(meta);
    });

    // Ping/pong for connection health - clear any existing interval first
    if (pingIntervalId) {
      clearInterval(pingIntervalId);
    }
    pingIntervalId = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('ping');
      }
    }, 30000);

    newSocket.on('pong', () => {
    });

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (pingIntervalId) {
      clearInterval(pingIntervalId);
      pingIntervalId = null;
    }
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  subscribe: (room: SocketRoom) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('subscribe', { room });
    }
  },

  unsubscribe: (room: SocketRoom) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('unsubscribe', { room });
    }
  },

  markFeedOk: () => set({ lastFeedOkAt: Date.now() })
}));

/**
 * Derived feed status: 'live' (real socket events flowing), 'polling'
 * (no socket events but REST data is fresh), or 'offline'.
 * hasData lets pages factor in their own loaded data.
 */
export function getFeedStatus(
  s: { lastEventAt: number; lastFeedOkAt: number },
  hasData = false
): 'live' | 'polling' | 'offline' {
  const now = Date.now();
  if (s.lastEventAt > 0 && now - s.lastEventAt < 30_000) return 'live';
  if (hasData || (s.lastFeedOkAt > 0 && now - s.lastFeedOkAt < 60_000)) return 'polling';
  return 'offline';
}
