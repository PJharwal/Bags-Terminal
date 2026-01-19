import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { WalletProvider } from "@/components/wallet";
import { TurnkeyProvider } from "@/components/turnkey";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Omnera Frontend",
  description: "Advanced Crypto Analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased min-h-screen bg-background text-foreground`}
      >
        {/* TurnkeyProvider: Embedded one-click wallets */}
        <WalletProvider>
          <TurnkeyProvider>
            <Navbar />
            <main className="container mx-auto px-4 py-8">{children}</main>
          </TurnkeyProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
