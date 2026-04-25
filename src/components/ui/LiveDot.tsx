"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type LiveDotStatus = "live" | "warn" | "down" | "idle";
export type LiveDotSize = "xs" | "sm";

export interface LiveDotProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  status: LiveDotStatus;
  label?: ReactNode;
  size?: LiveDotSize;
  pulse?: boolean;
  /** Render the label visually (default true). When false, label is sr-only. */
  showLabel?: boolean;
}

const colorClasses: Record<LiveDotStatus, { dot: string; text: string }> = {
  live: { dot: "bg-acid-green", text: "text-acid-green" },
  warn: { dot: "bg-warn", text: "text-warn" },
  down: { dot: "bg-error", text: "text-error" },
  idle: { dot: "bg-muted-high", text: "text-muted-high" },
};

const dotSizeClasses: Record<LiveDotSize, string> = {
  xs: "w-1.5 h-1.5",
  sm: "w-2 h-2",
};

const textSizeClasses: Record<LiveDotSize, string> = {
  xs: "text-meta",
  sm: "text-data",
};

const STATUS_LABEL: Record<LiveDotStatus, string> = {
  live: "Live",
  warn: "Warning",
  down: "Offline",
  idle: "Idle",
};

/**
 * Single primitive replacing 6 hand-rolled status indicators.
 * `live` pulses by default; others are static.
 */
export function LiveDot({
  status,
  label,
  size = "sm",
  pulse,
  showLabel = true,
  className,
  ...rest
}: LiveDotProps) {
  const shouldPulse = pulse ?? status === "live";
  const colors = colorClasses[status];
  const ariaLabel = typeof label === "string" ? label : STATUS_LABEL[status];

  return (
    <span
      role="status"
      aria-live={status === "live" ? "polite" : undefined}
      aria-label={!showLabel || !label ? ariaLabel : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 font-mono",
        textSizeClasses[size],
        colors.text,
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cn(
          dotSizeClasses[size],
          colors.dot,
          shouldPulse && "animate-pulse",
        )}
      />
      {showLabel && label}
    </span>
  );
}
