'use client';

import { useSocketStore } from '@/store/socket.store';
import type { Chain } from '@/types';

interface WebSocketState {
  isConnected: boolean;
  error: string | null;
  reconnectAttempts: number;
}

/**
 * Custom WebSocket hook mapping the global Socket.io client state
 * to the Axiom Pulse visual connection metrics.
 */
export function useMobulaWebSocket(chain: Chain): WebSocketState {
  const isConnected = useSocketStore((state) => state.isConnected);

  return {
    isConnected,
    error: null,
    reconnectAttempts: 0,
  };
}
