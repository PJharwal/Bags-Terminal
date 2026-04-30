import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { config } from '@/config/env';
import { NewTokenEvent, TradeEvent, MigrationEvent, SocketRoom } from '@/types/socket';
import { usePulseStore } from './pulse.store';

// BAGS token filter - only tokens with CA ending in 'bags'
const isBagsToken = (mint: string): boolean => {
  return mint.toLowerCase().endsWith('bags');
};

// Store ping interval ID for cleanup
let pingIntervalId: ReturnType<typeof setInterval> | null = null;
let socketConnectInFlight = false;

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  latestTokens: NewTokenEvent[];
  latestTrades: TradeEvent[];
  // Filtered BAGS-only arrays
  bagsTokens: NewTokenEvent[];
  bagsTrades: TradeEvent[];

  // Actions
  connect: () => void;
  disconnect: () => void;
  subscribe: (room: SocketRoom) => void;
  unsubscribe: (room: SocketRoom) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  latestTokens: [],
  latestTrades: [],
  bagsTokens: [],
  bagsTrades: [],

  connect: () => {
    const { socket } = get();
    if (socket || socketConnectInFlight) return;

    socketConnectInFlight = true;

    const newSocket = io(config.baseServerUrl, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      socketConnectInFlight = false;
      set({ isConnected: true });

      // Sync with pulse store
      usePulseStore.getState().setConnected(true);

      // Subscribe to all token/trade rooms
      get().subscribe('new_tokens:all');
      get().subscribe('trades:all');
      get().subscribe('migrations:all');
    });

    newSocket.on('disconnect', () => {
      set({ isConnected: false });

      // Sync with pulse store
      usePulseStore.getState().setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      socketConnectInFlight = false;
      console.error('Socket connection error:', error.message);
    });

    newSocket.on('subscribed', (_data: { room: string }) => {
    });

    // Handle new token events
    newSocket.on('new_token', (token: NewTokenEvent) => {
      // Add to all tokens
      set((state) => ({
        latestTokens: [token, ...state.latestTokens].slice(0, 50)
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
      // Add to all trades
      set((state) => ({
        latestTrades: [trade, ...state.latestTrades].slice(0, 100)
      }));

      // Track BAGS token trades separately
      if (isBagsToken(trade.mint)) {
        set((state) => ({
          bagsTrades: [trade, ...state.bagsTrades].slice(0, 100)
        }));
      }

      // Update ALL trades in pulse store for UI display
      usePulseStore.getState().updateFromTrade(trade);
    });

    // Handle migration events
    newSocket.on('migration', (migration: MigrationEvent) => {
      // Update pulse store - transition to MIGRATED state for all tokens
      usePulseStore.getState().transitionItem(migration.mint, 'MIGRATED');
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
    socketConnectInFlight = false;
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
  }
}));
