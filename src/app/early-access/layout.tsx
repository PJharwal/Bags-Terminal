import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import React from "react";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Pretext - Early Access",
  description: "Pure JavaScript/TypeScript library for multiline text measurement & layout.",
};

export default function EarlyAccessLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // We apply a fixed wrapper that covers the entire screen, blocking out the dark Global Layout.
  return (
    <div 
      className={`fixed inset-0 z-[100] overflow-y-auto bg-[#F0EEE9] text-[#1a1a1a] ${playfair.variable} ${inter.variable} font-sans`}
    >
      {children}
    </div>
  );
}
