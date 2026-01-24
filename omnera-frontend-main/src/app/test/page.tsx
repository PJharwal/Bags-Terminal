"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface SocketEvent {
    id: number;
    type: string;
    timestamp: string;
    data: any;
}

const SOCKET_URL = "https://backend.solshift.fun";

const SUBSCRIPTIONS = [
    { label: "New Tokens", room: "new_tokens:all" },
    { label: "All Trades", room: "trades:all" },
    { label: "Pumpfun Trades", room: "trades:pumpfun" },
    { label: "Pumpswap Trades", room: "trades:pumpswap" },
    { label: "Migrations all", room: "migrations:all" },
    { label: "Metadata Updates", room: "metadata:all" }
];

export default function SocketTestPage() {
    const [events, setEvents] = useState<SocketEvent[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [filter, setFilter] = useState<string>("all");
    const [customRoom, setCustomRoom] = useState("");
    const [activeSubscriptions, setActiveSubscriptions] = useState<string[]>([]);
    const socketRef = useRef<Socket | null>(null);
    const eventIdRef = useRef(0);

    const addEvent = useCallback((type: string, data: any) => {
        const newEvent: SocketEvent = {
            id: eventIdRef.current++,
            type,
            timestamp: new Date().toLocaleTimeString(),
            data,
        };
        setEvents(prev => [newEvent, ...prev].slice(0, 100)); // Keep last 100 events
    }, []);

    const connect = useCallback(() => {
        if (socketRef.current?.connected) {
            console.log("Already connected");
            return;
        }

        console.log("Connecting to:", SOCKET_URL);
        const socket = io(SOCKET_URL, {
            transports: ["websocket"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Socket.IO connected:", socket.id);
            setIsConnected(true);
            addEvent("connection", { status: "connected", id: socket.id, url: SOCKET_URL });
        });

        socket.on("disconnect", (reason) => {
            console.log("Socket.IO disconnected:", reason);
            setIsConnected(false);
            setActiveSubscriptions([]);
            addEvent("connection", { status: "disconnected", reason });
        });

        socket.on("connect_error", (error) => {
            console.error("Socket.IO connection error:", error);
            addEvent("error", { message: error.message });
        });

        socket.on("pong", (data) => {
            addEvent("pong", data);
        });

        // Catch ALL events
        socket.onAny((eventName, ...args) => {
            console.log("Event received:", eventName, args);
            addEvent(eventName, args.length === 1 ? args[0] : args);
        });

    }, [addEvent]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    }, []);

    const subscribe = useCallback((room: string) => {
        if (socketRef.current?.connected) {
            console.log("Subscribing to:", room);
            socketRef.current.emit("subscribe", { room });
            addEvent("sent:subscribe", { room });
            setActiveSubscriptions(prev =>
                prev.includes(room) ? prev : [...prev, room]
            );
        } else {
            addEvent("error", { message: "Socket not connected" });
        }
    }, [addEvent]);

    const unsubscribe = useCallback((room: string) => {
        if (socketRef.current?.connected) {
            console.log("Unsubscribing from:", room);
            socketRef.current.emit("unsubscribe", { room });
            addEvent("sent:unsubscribe", { room });
            setActiveSubscriptions(prev => prev.filter(r => r !== room));
        }
    }, [addEvent]);

    const sendPing = useCallback(() => {
        if (socketRef.current?.connected) {
            socketRef.current.emit("ping");
            addEvent("sent:ping", { timestamp: Date.now() });
        } else {
            addEvent("error", { message: "Socket not connected" });
        }
    }, [addEvent]);

    const subscribeCustom = () => {
        if (customRoom.trim()) {
            subscribe(customRoom.trim());
            setCustomRoom("");
        }
    };

    useEffect(() => {
        connect();
        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    const filteredEvents = filter === "all"
        ? events
        : events.filter(e => e.type === filter);

    const clearEvents = () => setEvents([]);

    const uniqueEventTypes = [...new Set(events.map(e => e.type))];

    return (
        <div className="min-h-screen p-6 bg-black text-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    🔌 Socket.IO Test
                    <span className={`text-sm px-2 py-1 rounded ${isConnected ? "bg-green-600" : "bg-red-600"}`}>
                        {isConnected ? "Connected" : "Disconnected"}
                    </span>
                </h1>
                <div className="flex gap-3">
                    <button
                        onClick={isConnected ? disconnect : connect}
                        className={`px-4 py-2 rounded text-sm font-medium ${isConnected
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-green-600 hover:bg-green-700"
                            }`}
                    >
                        {isConnected ? "Disconnect" : "Connect"}
                    </button>
                </div>
            </div>

            {/* Connection Info */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-400 mb-1">Endpoint</div>
                <code className="text-green-400">{SOCKET_URL}</code>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-400 mb-3">Quick Actions</div>
                <div className="flex flex-wrap gap-2">
                    {SUBSCRIPTIONS.map((sub, idx) => (
                        <button
                            key={idx}
                            onClick={() => subscribe(sub.room)}
                            disabled={!isConnected}
                            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${isConnected
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-gray-700 text-gray-500 cursor-not-allowed"
                                }`}
                        >
                            Subscribe: {sub.label}
                        </button>
                    ))}
                    <button
                        onClick={sendPing}
                        disabled={!isConnected}
                        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${isConnected
                            ? "bg-cyan-600 hover:bg-cyan-700 text-white"
                            : "bg-gray-700 text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        🏓 Ping
                    </button>
                </div>

                {/* Active Subscriptions */}
                {activeSubscriptions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="text-xs text-gray-500 mb-2">Active Subscriptions:</div>
                        <div className="flex flex-wrap gap-2">
                            {activeSubscriptions.map((room, idx) => (
                                <span
                                    key={idx}
                                    className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded flex items-center gap-2"
                                >
                                    {room}
                                    <button
                                        onClick={() => unsubscribe(room)}
                                        className="hover:text-red-400"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Room Subscription */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-400 mb-3">Subscribe to Custom Room</div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={customRoom}
                        onChange={(e) => setCustomRoom(e.target.value)}
                        placeholder="room_name:filter"
                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm font-mono"
                        onKeyDown={(e) => e.key === "Enter" && subscribeCustom()}
                    />
                    <button
                        onClick={subscribeCustom}
                        disabled={!isConnected || !customRoom.trim()}
                        className={`px-4 py-2 rounded text-sm font-medium ${isConnected && customRoom.trim()
                            ? "bg-purple-600 hover:bg-purple-700"
                            : "bg-gray-700 text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        Subscribe
                    </button>
                </div>
            </div>

            {/* Stats & Filter */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex gap-4">
                    <div className="text-sm">
                        <span className="text-gray-400">Total Events:</span>{" "}
                        <span className="font-bold">{events.length}</span>
                    </div>
                    <div className="text-sm">
                        <span className="text-gray-400">Showing:</span>{" "}
                        <span className="font-bold">{filteredEvents.length}</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm"
                    >
                        <option value="all">All Events</option>
                        {uniqueEventTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    <button
                        onClick={clearEvents}
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Events List */}
            <div className="space-y-3 max-h-[calc(100vh-520px)] overflow-y-auto">
                {filteredEvents.length === 0 ? (
                    <div className="text-center text-gray-500 py-20">
                        {isConnected
                            ? "Waiting for events... Try subscribing to a room above."
                            : "Connect to start receiving events."}
                    </div>
                ) : (
                    filteredEvents.map((event) => (
                        <div
                            key={event.id}
                            className="bg-gray-900 border border-gray-700 rounded-lg p-4"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-mono px-2 py-1 rounded ${event.type === "connection" ? "bg-blue-900 text-blue-300" :
                                    event.type.startsWith("sent:") ? "bg-purple-900 text-purple-300" :
                                        event.type === "error" ? "bg-red-900 text-red-300" :
                                            event.type === "pong" ? "bg-cyan-900 text-cyan-300" :
                                                "bg-gray-700 text-gray-300"
                                    }`}>
                                    {event.type}
                                </span>
                                <span className="text-gray-500 text-xs">{event.timestamp}</span>
                            </div>
                            <pre className="text-xs text-gray-300 overflow-x-auto bg-black/50 p-3 rounded whitespace-pre-wrap break-words">
                                {JSON.stringify(event.data, null, 2)}
                            </pre>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
