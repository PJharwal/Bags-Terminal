"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "gold" | "destructive" | "ghost" | "bare";
export type ButtonSize = "xs" | "sm" | "md";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-acid-green text-black font-bold hover:brightness-110 active:scale-[0.97] " +
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100 disabled:active:scale-100",
  gold:
    "border border-gold/25 bg-gold/10 text-gold font-bold hover:border-gold/35 hover:bg-gold/15 active:scale-[0.97] " +
    "disabled:opacity-50 disabled:cursor-not-allowed",
  destructive:
    "bg-error text-white font-bold hover:brightness-110 active:scale-[0.97] " +
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent border border-default text-fg-soft hover:border-acid-green/40 hover:text-fg " +
    "active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed",
  bare:
    "bg-transparent text-muted-high hover:text-fg active:scale-95 " +
    "disabled:opacity-40 disabled:cursor-not-allowed",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "min-h-6 px-2 py-1 text-meta gap-1",
  sm: "min-h-8 px-3 py-1.5 text-data gap-1.5",
  md: "min-h-9 px-4 py-2 text-data gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "ghost",
    size = "md",
    loading = false,
    iconLeft,
    iconRight,
    children,
    fullWidth,
    className,
    disabled,
    type = "button",
    "aria-label": ariaLabel,
    ...props
  },
  ref,
) {
  const isIconOnly = !children && (iconLeft || iconRight);
  const iconOnlyPadding = isIconOnly
    ? size === "xs"
      ? "!px-1"
      : size === "sm"
        ? "!px-2"
        : "!px-2.5"
    : "";

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center justify-center font-mono uppercase tracking-wider",
        "transition-[transform,filter,border-color,background-color,color] duration-150",
        "focus-ring whitespace-nowrap select-none",
        variantClasses[variant],
        sizeClasses[size],
        iconOnlyPadding,
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2
          aria-hidden="true"
          className={cn(
            "animate-spin",
            size === "xs" ? "w-3 h-3" : size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4",
          )}
        />
      ) : (
        iconLeft && <span aria-hidden="true" className="inline-flex shrink-0">{iconLeft}</span>
      )}
      {children}
      {!loading && iconRight && (
        <span aria-hidden="true" className="inline-flex shrink-0">{iconRight}</span>
      )}
    </button>
  );
});
