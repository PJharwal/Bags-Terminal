import type { Metadata } from "next";
import "./globals.css";
import TopBar from "@/components/TopBar";
import SocketInitializer from "@/components/terminal/SocketInitializer";
import { WalletProviderWrapper } from "@/components/wallet/WalletProviderWrapper";
import { TurnkeyProvider } from "@/components/turnkey/TurnkeyProvider";
import { ToastContainer } from "@/components/ui/Toast";
import { LiveTicker } from "@/components/ui/LiveTicker";

export const metadata: Metadata = {
  title: "BAGS Terminal",
  description: "Deployer intelligence for BAGS tokens",
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
