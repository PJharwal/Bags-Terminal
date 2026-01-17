"use client";

import type { Event } from "@/lib/types";
import { formatTimeAgo, getSeverityColor, getSeverityBgColor } from "@/lib/format";

interface SignalCardProps {
    event: Event;
    onClick?: () => void;
}

const eventTypeIcons: Record<string, string> = {
    launch: "🚀",
    funding: "💰",
    distribution: "📊",
    alert: "⚠️",
    rug: "🔴",
    whale_entry: "🐋",
};

export function SignalCard({ event, onClick }: SignalCardProps) {
    return (
        <div
            onClick={onClick}
            className={`p-3 rounded-lg border ${getSeverityBgColor(event.severity)} cursor-pointer hover:bg-white/5 transition-all`}
        >
            <div className="flex items-start gap-2">
                <span className="text-sm">{eventTypeIcons[event.type] || "📌"}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-medium ${getSeverityColor(event.severity)}`}>
                            {event.title}
                        </span>
                        <span className="text-[10px] text-[#9AA0A6] whitespace-nowrap">
                            {formatTimeAgo(event.timestamp)}
                        </span>
                    </div>
                    <p className="text-xs text-[#9AA0A6] mt-1 line-clamp-2">
                        {event.description}
                    </p>
                    {(event.related_token || event.related_deployer) && (
                        <div className="flex gap-2 mt-2">
                            {event.related_token && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded text-[#4C8DFF]">
                                    {event.related_token}
                                </span>
                            )}
                            {event.related_deployer && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded text-[#9AA0A6] font-mono">
                                    {event.related_deployer}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
