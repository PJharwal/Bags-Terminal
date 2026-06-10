import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.bagsterminal.fm";

// Public, crawlable routes. Wallet-gated (/creator), API, the investor deck
// (/pitch) and the orphan /early-access template are intentionally excluded.
const routes = [
  "",
  "/pulse",
  "/trending",
  "/launch",
  "/analyze",
  "/deployers",
  "/perps",
  "/prediction",
  "/terminal",
  "/fee-leaders",
  "/links",
  "/axiom-alternative",
  "/photon-alternative",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return routes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/pulse" || path === "/trending" ? "hourly" : "weekly",
    priority: path === "" ? 1 : path === "/launch" ? 0.9 : 0.7,
  }));
}
