"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import { WalletButton } from "@/components/wallet/WalletButton";
import { BagsLogo } from "@/components/ui/BagsLogo";
import { TokenSearch } from "@/components/ui/TokenSearch";

const navItems = [
    { href: "/", label: "HOME" },
    { href: "/pulse", label: "PULSE" },
    { href: "/trending", label: "TRENDING" },
    { href: "/perps", label: "PERPS" },
    { href: "/prediction", label: "PREDICTION" },
    { href: "/launch", label: "LAUNCH" },
    { href: "/creator", label: "CREATOR" },
];

export default function TopBar() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Live clock (UTC) — subtle trust signal. Only runs after mount (avoids hydration mismatch).
    useEffect(() => {
        setNow(new Date());
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <header
            className={`accent-line-top h-14 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled
                    ? "glass-heavy border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                    : "bg-[#050505] border-white/10"
                } font-mono`}
        >
            {/* Logo & Nav */}
            <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-8 h-8 flex items-center justify-center transition-transform duration-150 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(57,255,20,0.35)]">
                        <BagsLogo size={30} />
                    </div>
                    <span className="text-sm font-display font-bold tracking-tighter group-hover:text-[#39FF14] transition-colors">
                        BAGS<span className="text-[#888]">_</span>TERM
                    </span>
                </Link>

                <nav className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`px-4 py-1.5 text-[11px] font-bold tracking-widest transition-all relative group ${pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                                    ? "text-[#39FF14]"
                                    : "text-[#888] hover:text-[#EDEDED]"
                                }`}
                        >
                            {item.label}
                            <div className={`absolute bottom-0 left-4 right-4 h-[1px] bg-[#39FF14] transition-all duration-300 origin-left ${pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                                    ? "scale-x-100"
                                    : "scale-x-0 group-hover:scale-x-100"
                                }`} />
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
                {/* Global token search — name/symbol or contract address */}
                <TokenSearch className="hidden sm:block w-[180px] lg:w-[240px]" />

                {/* UTC clock — hidden on narrow */}
                <span className="hidden xl:inline text-[10px] font-mono tabular-nums text-[#555] tracking-wider">
                    {now
                        ? now.toISOString().replace("T", " ").slice(0, 19) + " UTC"
                        : "— — — —"}
                </span>


                {/* System Controls */}
                <div className="flex items-center gap-2">
                    <WalletButton />
                </div>
            </div>

            {/* Top Scanning Line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#39FF14]/30 to-transparent opacity-50" />
        </header>
    );
}
