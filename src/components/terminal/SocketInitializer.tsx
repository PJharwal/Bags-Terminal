"use client";

import { useEffect } from "react";
import { useSocketStore } from "@/store/socket.store";

export default function SocketInitializer() {
  const connect = useSocketStore((state) => state.connect);
  const disconnect = useSocketStore((state) => state.disconnect);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return null;
}
