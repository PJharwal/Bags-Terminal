import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Pretext - Early Access",
  description: "Pure JavaScript/TypeScript library for multiline text measurement & layout.",
};

export default function EarlyAccessLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fontVariables = {
    "--font-playfair": "Georgia, 'Times New Roman', serif",
    "--font-inter": "Inter, system-ui, sans-serif",
  } as React.CSSProperties;

  // We apply a fixed wrapper that covers the entire screen, blocking out the dark Global Layout.
  return (
    <div
      style={{ zIndex: 'var(--z-toast)', ...fontVariables }}
      className="fixed inset-0 overflow-y-auto bg-[#F0EEE9] text-[#1a1a1a] font-sans"
    >
      {children}
    </div>
  );
}
