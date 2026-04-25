"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
}

interface InjectedProps {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  invalid?: boolean;
}

/**
 * Composes label + control + error/helper with proper htmlFor / aria-describedby wiring.
 * The first valid React child receives an injected id, aria-describedby, and aria-invalid.
 * Standardizes label↔input gap (--space-field-gap) and field-block spacing (--space-field-block).
 */
export function Field({
  label,
  helper,
  error,
  required,
  children,
  className,
  ...rest
}: FieldProps) {
  const reactId = useId();
  const inputId = `field-${reactId}`;
  const describedBy: string[] = [];
  if (helper) describedBy.push(`${inputId}-helper`);
  if (error) describedBy.push(`${inputId}-error`);

  // Find the index of the first valid React child so we only inject into one element.
  const childArray = Children.toArray(children);
  const firstValidIndex = childArray.findIndex((c) => isValidElement(c));
  const wrappedChildren = childArray.map((child, i) => {
    if (i === firstValidIndex && isValidElement(child)) {
      const childProps: InjectedProps = {
        id: inputId,
        "aria-describedby": describedBy.length ? describedBy.join(" ") : undefined,
        "aria-invalid": Boolean(error) || undefined,
        invalid: Boolean(error) || undefined,
      };
      return cloneElement(child as ReactElement<InjectedProps>, childProps);
    }
    return child;
  });

  return (
    <div className={cn("flex flex-col gap-[var(--space-field-gap)]", className)} {...rest}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-meta uppercase tracking-wider text-muted-high font-mono"
        >
          {label}
          {required && <span className="ml-1 text-[var(--color-error)]" aria-hidden="true">*</span>}
        </label>
      )}
      {wrappedChildren}
      {helper && !error && (
        <p id={`${inputId}-helper`} className="text-meta text-muted-mid font-mono">
          {helper}
        </p>
      )}
      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="text-meta text-[var(--color-error)] font-mono"
        >
          {error}
        </p>
      )}
    </div>
  );
}
