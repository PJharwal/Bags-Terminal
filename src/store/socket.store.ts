import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { config } from '@/config/env';
import { NewTokenEvent, TradeEvent, MigrationEvent, SocketRoom } from '@/types/socket';

// BAGS token filter - only tokens with CA ending in 'bags'
const isBagsToken = (mint: string): boolean => {
  return mint.toLowerCase().endsWith('bags');
};

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
    if (socket?.connected) return;

    console.log('Connecting to socket:', config.baseServerUrl);

    const newSocket = io(config.baseServerUrl, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      set({ isConnected: true });

      // Subscribe to all token/trade rooms
      get().subscribe('new_tokens:all');
      get().subscribe('trades:all');
      get().subscribe('migrations:all');
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      set({ isConnected: false });
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    newSocket.on('subscribed', (data: { room: string }) => {
      console.log('Subscribed to room:', data.room);
    });

    // Handle new token events
    newSocket.on('new_token', (token: NewTokenEvent) => {
      console.log('New token:', token.symbol, token.mint);

      // Add to all tokens
      set((state) => ({
        latestTokens: [token, ...state.latestTokens].slice(0, 50)
      }));

      // Filter for BAGS tokens (CA ends with 'bags')
      if (isBagsToken(token.mint)) {
        console.log('BAGS token found:', token.symbol, token.mint);
        set((state) => ({
          bagsTokens: [token, ...state.bagsTokens].slice(0, 50)
        }));
      }
    });

    // Handle trade events
    newSocket.on('trade', (trade: TradeEvent) => {
      // Add to all trades
      set((state) => ({
        latestTrades: [trade, ...state.latestTrades].slice(0, 100)
      }));

      // Filter for BAGS token trades
      if (isBagsToken(trade.mint)) {
        set((state) => ({
          bagsTrades: [trade, ...state.bagsTrades].slice(0, 100)
        }));
      }
    });

    // Handle migration events
    newSocket.on('migration', (migration: MigrationEvent) => {
      console.log('Migration:', migration.symbol, migration.mint, '->', migration.to_dex);
    });

    // Ping/pong for connection health
    const pingInterval = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('ping');
      }
    }, 30000);

    newSocket.on('pong', () => {
      console.log('Pong received');
    });

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  subscribe: (room: SocketRoom) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('subscribe', { room });
      console.log('Subscribing to:', room);
    }
  },

  unsubscribe: (room: SocketRoom) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('unsubscribe', { room });
    }
  }
}));

