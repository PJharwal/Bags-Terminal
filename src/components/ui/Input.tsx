"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type InputSize = "sm" | "md";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  inputSize?: InputSize;
  invalid?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

const sizeClasses: Record<InputSize, string> = {
  sm: "px-2 py-1.5 text-xs",
  md: "px-3 py-2 text-sm",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, inputSize = "md", invalid, prefix, suffix, type, inputMode, pattern, ...props },
  ref,
) {
  const isNumeric = type === "number";
  const resolvedInputMode = inputMode ?? (isNumeric ? "decimal" : undefined);
  const resolvedPattern = pattern ?? (isNumeric ? "[0-9]*\\.?[0-9]*" : undefined);

  const baseInput = (
    <input
      ref={ref}
      type={type}
      inputMode={resolvedInputMode}
      pattern={resolvedPattern}
      aria-invalid={invalid || undefined}
      className={cn(
        "input w-full font-mono",
        sizeClasses[inputSize],
        prefix && "pl-7",
        suffix && "pr-12",
        className,
      )}
      {...props}
    />
  );

  if (!prefix && !suffix) return baseInput;

  return (
    <div className="relative w-full">
      {prefix && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-high font-mono"
        >
          {prefix}
        </span>
      )}
      {baseInput}
      {suffix && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-high font-mono"
        >
          {suffix}
        </span>
      )}
    </div>
  );
});
