import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { config } from '@/config/env';

// ==========================================
// Types
// ==========================================

export type OmneraTradeState =
  | 'idle'
  | 'preparing'
  | 'ready'
  | 'executing'
  | 'success'
  | 'error';

export interface PrepareEstimate {
  estimatedTokens: number;
  estimatedDisplay: number;
  pricePerToken: number;
  slippageBps: number;
  slippageWarning: string | null;
}

export interface PrepareEstimateSell {
  estimatedSol: number;
  estimatedSolDisplay: number;
  pricePerToken: number;
  slippageBps: number;
  slippageWarning: string | null;
}

export interface ExecuteResult {
  success: boolean;
  signature: string | null;
  tokensReceived: number | null;
  tokensDisplay: number | null;
  error: string | null;
  slippageWarning: string | null;
}

export interface OmneraQuoteResult {
  success: boolean;
  outputAmount: number;
  outputDisplay: number;
  pricePerToken: number;
  error: string | null;
}

export interface JitoTipData {
  data: number[];
  latest4blockSum: number;
}

// ==========================================
// Store
// ==========================================

interface OmneraStore {
  // Connection
  socket: Socket | null;
  isConnected: boolean;

  // Trade state
  tradeState: OmneraTradeState;
  estimate: PrepareEstimate | null;
  estimateSell: PrepareEstimateSell | null;
  executeResult: ExecuteResult | null;
  tradeError: string | null;

  // Jito
  jitoTipData: JitoTipData | null;

  // Actions
  connect: () => void;
  disconnect: () => void;
  setTradeState: (state: OmneraTradeState) => void;
  setEstimate: (estimate: PrepareEstimate | null) => void;
  setEstimateSell: (estimate: PrepareEstimateSell | null) => void;
  setExecuteResult: (result: ExecuteResult | null) => void;
  setTradeError: (error: string | null) => void;
  resetTrade: () => void;
}

export const useOmneraStore = create<OmneraStore>((set, get) => ({
  // Initial state
  socket: null,
  isConnected: false,
  tradeState: 'idle',
  estimate: null,
  estimateSell: null,
  executeResult: null,
  tradeError: null,
  jitoTipData: null,

  connect: () => {
    const { socket } = get();
    if (socket) return;

    if (!config.buysellServerUrl) {
      console.error('[Omnera] NEXT_PUBLIC_BUYSELL_SERVER_URL is not configured');
      return;
    }

    const newSocket = io(config.buysellServerUrl, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('[Omnera] Socket connected');
      set({ isConnected: true });
    });

    newSocket.on('disconnect', () => {
      console.log('[Omnera] Socket disconnected');
      set({ isConnected: false });
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Omnera] Socket connection error:', error.message);
    });

    // Trade result (instant trades via trade_request)
    newSocket.on('trade_result', (data: {
      success: boolean;
      signature?: string;
      tokens_received?: number;
      error?: string;
    }) => {
      if (data.success) {
        set({
          tradeState: 'success',
          executeResult: {
            success: true,
            signature: data.signature || null,
            tokensReceived: data.tokens_received || null,
            tokensDisplay: null,
            error: null,
            slippageWarning: null,
          },
        });
      } else {
        set({
          tradeState: 'error',
          tradeError: data.error || 'Trade failed',
        });
      }
    });

    // Prepare result (buy)
    newSocket.on('prepare_result', (data: {
      success: boolean;
      estimated_tokens?: number;
      estimated_display?: number;
      price_per_token?: number;
      ready: boolean;
      error?: string;
      slippage_bps?: number;
      slippage_warning?: string;
    }) => {
      if (data.success && data.ready) {
        set({
          tradeState: 'ready',
          estimate: {
            estimatedTokens: data.estimated_tokens || 0,
            estimatedDisplay: data.estimated_display || 0,
            pricePerToken: data.price_per_token || 0,
            slippageBps: data.slippage_bps || 0,
            slippageWarning: data.slippage_warning || null,
          },
        });
      } else {
        set({
          tradeState: 'error',
          tradeError: data.error || 'Prepare failed',
        });
      }
    });

    // Prepare sell result
    newSocket.on('prepare_sell_result', (data: {
      success: boolean;
      estimated_sol?: number;
      estimated_sol_display?: number;
      price_per_token?: number;
      ready: boolean;
      error?: string;
      slippage_bps?: number;
      slippage_warning?: string;
    }) => {
      if (data.success && data.ready) {
        set({
          tradeState: 'ready',
          estimateSell: {
            estimatedSol: data.estimated_sol || 0,
            estimatedSolDisplay: data.estimated_sol_display || 0,
            pricePerToken: data.price_per_token || 0,
            slippageBps: data.slippage_bps || 0,
            slippageWarning: data.slippage_warning || null,
          },
        });
      } else {
        set({
          tradeState: 'error',
          tradeError: data.error || 'Prepare sell failed',
        });
      }
    });

    // Execute result (both buy and sell)
    newSocket.on('execute_result', (data: {
      success: boolean;
      signature?: string;
      tokens_received?: number;
      tokens_display?: number;
      error?: string;
      slippage_warning?: string;
    }) => {
      if (data.success) {
        set({
          tradeState: 'success',
          executeResult: {
            success: true,
            signature: data.signature || null,
            tokensReceived: data.tokens_received || null,
            tokensDisplay: data.tokens_display || null,
            error: null,
            slippageWarning: data.slippage_warning || null,
          },
        });
      } else {
        set({
          tradeState: 'error',
          tradeError: data.error || 'Execute failed',
        });
      }
    });

    // Jito tip broadcast (every 5s)
    newSocket.on('jito_tips', (data: {
      data: number[];
      latest_4block_sum: number;
    }) => {
      set({
        jitoTipData: {
          data: data.data,
          latest4blockSum: data.latest_4block_sum,
        },
      });
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

  setTradeState: (state) => set({ tradeState: state }),
  setEstimate: (estimate) => set({ estimate }),
  setEstimateSell: (estimate) => set({ estimateSell: estimate }),
  setExecuteResult: (result) => set({ executeResult: result }),
  setTradeError: (error) => set({ tradeError: error }),

  resetTrade: () => set({
    tradeState: 'idle',
    estimate: null,
    estimateSell: null,
    executeResult: null,
    tradeError: null,
  }),
}));
