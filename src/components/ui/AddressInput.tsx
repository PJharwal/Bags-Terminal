"use client";

import { forwardRef, useCallback, useMemo, type ChangeEvent, type ClipboardEvent } from "react";
import { Check, X } from "lucide-react";
import { Input, type InputProps } from "./Input";

const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const defaultValidator = (addr: string) => BASE58_RE.test(addr);

export interface AddressInputProps extends Omit<InputProps, "type" | "suffix"> {
  validator?: (addr: string) => boolean;
  showValidationGlyph?: boolean;
  /** Called once a valid address is entered (after validation). */
  onValid?: (addr: string) => void;
}

/**
 * Standardized Solana address input. Provides:
 *  - Paste handler that strips whitespace
 *  - Configurable validation (default: base58 32-44 chars)
 *  - Visual ✓/✕ glyph in the suffix slot when content is non-empty
 *  - aria-invalid wiring through Input
 */
export const AddressInput = forwardRef<HTMLInputElement, AddressInputProps>(function AddressInput(
  { validator = defaultValidator, showValidationGlyph = true, value, onChange, onValid, onPaste, invalid, ...props },
  ref,
) {
  const stringValue = typeof value === "string" ? value : value != null ? String(value) : "";
  const isEmpty = stringValue.trim().length === 0;
  const isValid = !isEmpty && validator(stringValue.trim());
  const showInvalid = invalid ?? (!isEmpty && !isValid);

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData.getData("text").replace(/\s+/g, "");
      if (pasted) {
        e.preventDefault();
        const synthetic = { target: { value: pasted } } as ChangeEvent<HTMLInputElement>;
        onChange?.(synthetic);
        if (validator(pasted)) onValid?.(pasted);
      }
      onPaste?.(e);
    },
    [onChange, onPaste, onValid, validator],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      const next = e.target.value.trim();
      if (next && validator(next)) onValid?.(next);
    },
    [onChange, onValid, validator],
  );

  const suffix = useMemo(() => {
    if (!showValidationGlyph || isEmpty) return undefined;
    return isValid ? (
      <Check size={12} aria-label="Valid address" className="text-acid-green" />
    ) : (
      <X size={12} aria-label="Invalid address" className="text-error" />
    );
  }, [showValidationGlyph, isEmpty, isValid]);

  return (
    <Input
      ref={ref}
      type="text"
      autoComplete="off"
      spellCheck={false}
      value={value}
      invalid={showInvalid}
      suffix={suffix}
      onChange={handleChange}
      onPaste={handlePaste}
      className="font-mono"
      {...props}
    />
  );
});
