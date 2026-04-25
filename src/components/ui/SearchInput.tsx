"use client";

import { Search } from "lucide-react";
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  containerClassName?: string;
  iconSize?: number;
}

/**
 * Standardized search input. Replaces 3 inconsistent search bars
 * (Deployers pl-10, Analyze pl-12, Terminal missing offset).
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { className, containerClassName, iconSize = 16, placeholder = "Search…", "aria-label": ariaLabel, ...props },
  ref,
) {
  return (
    <div className={cn("relative w-full", containerClassName)}>
      <Search
        size={iconSize}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-high z-10"
      />
      <input
        ref={ref}
        type="search"
        placeholder={placeholder}
        aria-label={ariaLabel ?? (typeof placeholder === "string" ? placeholder : "Search")}
        className={cn("input w-full font-mono !pl-10 pr-3 text-sm", className)}
        {...props}
      />
    </div>
  );
});
