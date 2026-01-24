import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TopBar from "@/components/TopBar";
import ModuleNavigation from "@/components/terminal/ModuleNavigation";
import SocketInitializer from "@/components/terminal/SocketInitializer";
import { WalletProviderWrapper } from "@/components/wallet/WalletProviderWrapper";
import { ToastContainer } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased text-[#E6E8EB]`}>
        <WalletProviderWrapper>
          <TopBar />
          <main className="min-h-screen pt-14 flex flex-col">
            <SocketInitializer />
            <ModuleNavigation />
            <div className="flex-1">
              {children}
            </div>
          </main>
          <ToastContainer />
        </WalletProviderWrapper>
      </body>
    </html>
  );
}
