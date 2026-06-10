"use client";

import Script from "next/script";

// Loads the Plausible script only when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set.
// No env → renders nothing (analytics stays a no-op).
export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;
  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
