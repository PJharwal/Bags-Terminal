"use client";

// Singleton manager for Hyperliquid's public WebSocket (read-only market data
// subscriptions only — never signed/exchange messages). Ref-counted subs,
// auto-reconnect with backoff, 50s keepalive ping, polling-fallback status.

import { useEffect, useState } from "react";

export type WsStatus = "connecting" | "live" | "down";

export interface WsSub {
  type: "allMids" | "l2Book" | "trades" | "candle" | "activeAssetCtx" | "bbo";
  coin?: string;
  interval?: string;
  nSigFigs?: number;
}

type Listener = (data: unknown) => void;

interface Entry {
  sub: WsSub;
  listeners: Set<Listener>;
}

const WS_URL = "wss://api.hyperliquid.xyz/ws";

let ws: WebSocket | null = null;
let status: WsStatus = "down";
let retry = 0;
let pingTimer: ReturnType<typeof setInterval> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const entries = new Map<string, Entry>();
const statusListeners = new Set<(s: WsStatus) => void>();

function setStatus(s: WsStatus) {
  if (s === status) return;
  status = s;
  statusListeners.forEach((f) => f(s));
}

function send(obj: Record<string, unknown>) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

function stopTimers() {
  if (pingTimer) {
    clearInterval(pingTimer);
    pingTimer = null;
  }
}

function scheduleReconnect() {
  if (reconnectTimer || entries.size === 0) return;
  const delay = Math.min(15_000, 1000 * 2 ** Math.min(retry, 4));
  retry++;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}

function matches(sub: WsSub, channel: string, data: unknown): boolean {
  if (sub.type !== channel) return false;
  switch (channel) {
    case "allMids":
      return true;
    case "trades": {
      const arr = data as Array<{ coin?: string }>;
      return Array.isArray(arr) && arr.length > 0 && arr[0]?.coin === sub.coin;
    }
    case "candle": {
      const c = data as { s?: string; i?: string };
      return c?.s === sub.coin && c?.i === sub.interval;
    }
    default: {
      const d = data as { coin?: string };
      return d?.coin === sub.coin;
    }
  }
}

function connect() {
  if (typeof window === "undefined" || entries.size === 0) return;
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) return;
  setStatus("connecting");
  try {
    ws = new WebSocket(WS_URL);
  } catch {
    setStatus("down");
    scheduleReconnect();
    return;
  }
  ws.onopen = () => {
    retry = 0;
    setStatus("live");
    entries.forEach((e) => send({ method: "subscribe", subscription: e.sub }));
    stopTimers();
    pingTimer = setInterval(() => send({ method: "ping" }), 50_000);
  };
  ws.onmessage = (ev) => {
    let msg: { channel?: string; data?: unknown };
    try {
      msg = JSON.parse(ev.data as string);
    } catch {
      return;
    }
    const channel = msg.channel;
    if (!channel || channel === "subscriptionResponse" || channel === "pong" || channel === "error") return;
    entries.forEach((e) => {
      if (matches(e.sub, channel, msg.data)) e.listeners.forEach((f) => f(msg.data));
    });
  };
  ws.onclose = () => {
    stopTimers();
    ws = null;
    setStatus("down");
    scheduleReconnect();
  };
  ws.onerror = () => {
    ws?.close();
  };
}

function teardownIfIdle() {
  if (entries.size > 0) return;
  stopTimers();
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    const sock = ws;
    ws = null;
    sock.onclose = null;
    sock.close();
  }
  setStatus("down");
}

/** Subscribe to a Hyperliquid WS feed. Returns an unsubscribe function. */
export function subscribeHl(sub: WsSub, cb: Listener): () => void {
  const key = JSON.stringify(sub);
  let entry = entries.get(key);
  if (!entry) {
    entry = { sub, listeners: new Set() };
    entries.set(key, entry);
    send({ method: "subscribe", subscription: sub });
  }
  entry.listeners.add(cb);
  connect();
  return () => {
    const e = entries.get(key);
    if (!e) return;
    e.listeners.delete(cb);
    if (e.listeners.size === 0) {
      entries.delete(key);
      send({ method: "unsubscribe", subscription: sub });
      teardownIfIdle();
    }
  };
}

export function getWsStatus(): WsStatus {
  return status;
}

/** React hook: current WS connection status (drives LIVE vs DELAYED UI). */
export function useWsStatus(): WsStatus {
  const [s, setS] = useState<WsStatus>(status);
  useEffect(() => {
    setS(status);
    const cb = (next: WsStatus) => setS(next);
    statusListeners.add(cb);
    return () => {
      statusListeners.delete(cb);
    };
  }, []);
  return s;
}

/* ----------------------- WS payload shapes (typed) ---------------------- */

export interface WsBookLevel {
  px: string;
  sz: string;
  n: number;
}

export interface WsL2Book {
  coin: string;
  time: number;
  levels: [WsBookLevel[], WsBookLevel[]];
}

export interface WsTrade {
  coin: string;
  side: "B" | "A";
  px: string;
  sz: string;
  time: number;
  tid: number;
}

export interface WsCandle {
  t: number;
  s: string;
  i: string;
  o: string;
  c: string;
  h: string;
  l: string;
  v: string;
}

export interface WsActiveAssetCtx {
  coin: string;
  ctx: {
    funding: string;
    openInterest: string;
    prevDayPx: string;
    dayNtlVlm: string;
    premium: string | null;
    oraclePx: string;
    markPx: string;
    midPx: string | null;
    impactPxs: [string, string] | null;
    dayBaseVlm: string;
  };
}

export interface WsAllMids {
  mids: Record<string, string>;
}
