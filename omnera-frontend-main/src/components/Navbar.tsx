"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, TrendingUp, Home, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { WalletButton } from "@/components/wallet";
import { TurnkeyWalletButton } from "@/components/turnkey/TurnkeyWalletButton";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Pulse", href: "/pulse", icon: Activity },
  { name: "Trending", href: "/trending", icon: TrendingUp },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/token/${searchQuery.trim()}`);
      setSearchQuery("");
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
            <span className="text-xl font-bold tracking-tight">Omnera</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search token address..."
              className="h-9 w-64 rounded-md border border-border bg-surface px-9 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Wallet Connect Button */}
          {/* <WalletButton /> */}
          <TurnkeyWalletButton />
        </div>
      </div>
    </nav>
  );
}
