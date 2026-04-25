"use client";

import { forwardRef, useCallback, type ChangeEvent } from "react";
import { Minus, Plus } from "lucide-react";
import { Input, type InputProps } from "./Input";
import { cn } from "@/lib/utils";

export interface NumberInputProps extends Omit<InputProps, "type" | "onChange"> {
  presets?: number[];
  presetUnit?: string;
  showSpinner?: boolean;
  decimals?: number;
  /** numeric onChange. Receives parsed number or null. */
  onValueChange?: (value: number | null) => void;
  /** raw onChange (event-based) — set if you need the raw string. */
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  min?: number | string;
  max?: number | string;
}

const sanitizeDecimal = (raw: string) => raw.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");

/**
 * Trading-grade number input. Wraps <Input> with:
 *  - preset chip row (optional)
 *  - ± spinner buttons (optional, default off)
 *  - decimal-only sanitization on change
 *  - parsed numeric callback in addition to raw onChange
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  {
    presets,
    presetUnit,
    showSpinner = false,
    decimals = 4,
    onValueChange,
    onChange,
    value,
    min,
    max,
    suffix,
    className,
    ...inputProps
  },
  ref,
) {
  const step = `0.${"0".repeat(Math.max(0, decimals - 1))}1`;

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const cleaned = sanitizeDecimal(e.target.value);
      // Mutate the event target's value so downstream handlers (Field, raw onChange) see clean text
      e.target.value = cleaned;
      onChange?.(e);
      if (onValueChange) {
        if (cleaned === "" || cleaned === ".") return onValueChange(null);
        const n = parseFloat(cleaned);
        onValueChange(Number.isFinite(n) ? n : null);
      }
    },
    [onChange, onValueChange],
  );

  const adjust = useCallback(
    (dir: 1 | -1) => {
      const current = typeof value === "string" || typeof value === "number" ? parseFloat(String(value)) : NaN;
      const stepNum = parseFloat(step);
      const minNum = min !== undefined ? parseFloat(String(min)) : -Infinity;
      const maxNum = max !== undefined ? parseFloat(String(max)) : Infinity;
      const next = (Number.isFinite(current) ? current : 0) + dir * stepNum;
      const clamped = Math.min(maxNum, Math.max(minNum, next));
      const fixed = Number(clamped.toFixed(decimals));
      onValueChange?.(fixed);
      // Synthesize a change event for raw onChange consumers
      if (onChange) {
        const synthetic = { target: { value: String(fixed) } } as ChangeEvent<HTMLInputElement>;
        onChange(synthetic);
      }
    },
    [value, step, min, max, decimals, onValueChange, onChange],
  );

  return (
    <div className="flex flex-col gap-2">
      {presets && presets.length > 0 && (
        <div role="group" aria-label="Preset amounts" className="grid grid-cols-4 gap-2">
          {presets.map((p) => {
            const selected = String(value ?? "") === String(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => onValueChange?.(p)}
                aria-pressed={selected}
                className={cn(
                  "min-h-6 px-2 py-1 text-meta font-mono font-bold border transition-colors active:scale-95 focus-ring",
                  selected
                    ? "border-acid-green text-acid-green bg-acid-green/10"
                    : "border-line text-fg-soft hover:border-muted-high hover:text-fg",
                )}
              >
                {p}
                {presetUnit ? ` ${presetUnit}` : ""}
              </button>
            );
          })}
        </div>
      )}
      <div className={cn("relative", className)}>
        <Input
          ref={ref}
          type="number"
          inputMode="decimal"
          pattern="[0-9]*\.?[0-9]*"
          value={value as InputProps["value"]}
          step={step}
          min={min}
          max={max}
          suffix={suffix}
          onChange={handleChange}
          className={cn(showSpinner && "pr-12", suffix && showSpinner && "pr-20")}
          {...inputProps}
        />
        {showSpinner && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-px">
            <button
              type="button"
              onClick={() => adjust(1)}
              aria-label="Increase"
              className="inline-flex items-center justify-center w-6 h-3 text-muted-high hover:text-fg focus-ring"
            >
              <Plus size={10} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => adjust(-1)}
              aria-label="Decrease"
              className="inline-flex items-center justify-center w-6 h-3 text-muted-high hover:text-fg focus-ring"
            >
              <Minus size={10} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
