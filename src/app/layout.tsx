import type { Metadata } from "next";
import "./globals.css";
import TopBar from "@/components/TopBar";
import SocketInitializer from "@/components/terminal/SocketInitializer";
import { WalletProviderWrapper } from "@/components/wallet/WalletProviderWrapper";
import { TurnkeyProvider } from "@/components/turnkey/TurnkeyProvider";
import { ToastContainer } from "@/components/ui/Toast";
import { LiveTicker } from "@/components/ui/LiveTicker";

// Canonical host is www (apex bagsterminal.fm 307-redirects to www); OG image
// crawlers often don't follow redirects, so absolute URLs must use www.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.bagsterminal.fm";
const siteDescription =
  "Chain-abstracted trading terminal on Solana — spot memes, prediction markets, and perps in one interface, built on bags.fm.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BAGS Terminal",
    template: "%s | BAGS Terminal",
  },
  description: siteDescription,
  openGraph: {
    type: "website",
    siteName: "BAGS Terminal",
    title: "BAGS Terminal",
    description: siteDescription,
    url: "/",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "BAGS Terminal — one terminal, every market",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BAGS Terminal",
    description: siteDescription,
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased text-[#EDEDED]">
        <WalletProviderWrapper>
          <TurnkeyProvider>
            <TopBar />
            <main className="min-h-screen pt-14 flex flex-col">
              <SocketInitializer />
              <LiveTicker />
              <div className="flex-1">
                {children}
              </div>
            </main>
            <ToastContainer />
          </TurnkeyProvider>
        </WalletProviderWrapper>
      </body>
    </html>
  );
}
