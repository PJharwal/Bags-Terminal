"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type TextareaSize = "sm" | "md" | "lg";

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  textareaSize?: TextareaSize;
  invalid?: boolean;
  resize?: boolean;
}

const sizeClasses: Record<TextareaSize, string> = {
  sm: "min-h-[var(--h-textarea-sm)]",
  md: "min-h-[var(--h-textarea-md)]",
  lg: "min-h-[var(--h-textarea-lg)]",
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, textareaSize = "sm", invalid, resize = false, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "input w-full font-mono px-3 py-2 text-sm",
        sizeClasses[textareaSize],
        resize ? "resize-y" : "resize-none",
        className,
      )}
      {...props}
    />
  );
});
