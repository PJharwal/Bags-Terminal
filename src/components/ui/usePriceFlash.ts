"use client";

import { useEffect, useRef, useState } from "react";

export type FlashClass = "" | "flash-up" | "flash-down";

/**
 * Returns a one-shot CSS class to apply when `value` changes.
 * Compares against the previous value; emits `flash-up` / `flash-down`
 * for ~340ms then clears. Honors prefers-reduced-motion via the CSS rule.
 *
 * Usage:
 *   const flash = usePriceFlash(price);
 *   <span className={cn("num", flash)}>{price}</span>
 */
export function usePriceFlash(value: number | null | undefined, durationMs = 340): FlashClass {
  const prev = useRef<number | null | undefined>(value);
  const [klass, setKlass] = useState<FlashClass>("");

  useEffect(() => {
    const previous = prev.current;
    prev.current = value;
    if (value == null || previous == null || value === previous) return;
    const next: FlashClass = value > previous ? "flash-up" : "flash-down";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: synchronize a transient visual cue to an externally-mutating value (live price stream); the state is timer-cleared.
    setKlass(next);
    const t = setTimeout(() => setKlass(""), durationMs);
    return () => clearTimeout(t);
  }, [value, durationMs]);

  return klass;
}
