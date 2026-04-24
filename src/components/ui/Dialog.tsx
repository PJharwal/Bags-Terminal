"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;
export const DialogPortal = RadixDialog.Portal;

export const DialogOverlay = forwardRef<
  React.ElementRef<typeof RadixDialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Overlay>
>(({ className, ...props }, ref) => (
  <RadixDialog.Overlay
    ref={ref}
    style={{ zIndex: "var(--z-modal)" }}
    className={cn("dialog-overlay fixed inset-0", className)}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof RadixDialog.Content> {
  children: ReactNode;
  showClose?: boolean;
  hideOverlay?: boolean;
}

export const DialogContent = forwardRef<
  React.ElementRef<typeof RadixDialog.Content>,
  DialogContentProps
>(({ className, children, showClose = true, hideOverlay, ...props }, ref) => (
  <DialogPortal>
    {!hideOverlay && <DialogOverlay />}
    <RadixDialog.Content
      ref={ref}
      style={{ zIndex: "var(--z-modal)" }}
      className={cn(
        "dialog-content fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        "w-full max-w-md p-6 focus:outline-none",
        className,
      )}
      {...props}
    >
      {children}
      {showClose && (
        <RadixDialog.Close
          aria-label="Close"
          className="btn-press absolute top-3 right-3 flex items-center justify-center w-7 h-7 border border-white/10 text-[#666] hover:border-[#39FF14]/40 hover:text-[#EDEDED] focus-ring"
        >
          <X size={12} aria-hidden="true" />
        </RadixDialog.Close>
      )}
    </RadixDialog.Content>
  </DialogPortal>
));
DialogContent.displayName = "DialogContent";

export const DialogTitle = forwardRef<
  React.ElementRef<typeof RadixDialog.Title>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Title>
>(({ className, ...props }, ref) => (
  <RadixDialog.Title
    ref={ref}
    className={cn(
      "text-sm font-bold uppercase tracking-wider text-[#EDEDED] font-mono",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = forwardRef<
  React.ElementRef<typeof RadixDialog.Description>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Description>
>(({ className, ...props }, ref) => (
  <RadixDialog.Description
    ref={ref}
    className={cn("text-xs text-[#888] font-mono mt-2", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";
