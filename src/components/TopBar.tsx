"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import { WalletButton } from "@/components/wallet/WalletButton";
import { BagsLogo } from "@/components/ui/BagsLogo";
import { LiveDot } from "@/components/ui/LiveDot";

const navItems = [
    { href: "/", label: "HOME" },
    { href: "/pulse", label: "PULSE" },
    { href: "/terminal", label: "TERMINAL" },
    { href: "/trending", label: "TRENDING" },
    { href: "/deployers", label: "DEPLOYERS" },
    { href: "/analyze", label: "ANALYZE" },
    { href: "/launch", label: "LAUNCH" },
    { href: "/creator", label: "CREATOR" },
];

export default function TopBar() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`accent-line-top fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${scrolled
                    ? "glass-heavy border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.28)]"
                : "bg-[#07090c]/95 border-white/10"
                } font-mono`}
        >
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
                {/* Logo & Nav */}
                <div className="flex items-center gap-6 min-w-0">
                    <Link href="/" className="flex items-center gap-3 group focus-ring shrink-0">
                        <BagsLogo size={20} className="transition-transform duration-150 group-hover:scale-105" />
                        <span className="text-sm font-display font-bold tracking-tight text-white group-hover:text-fg-soft transition-colors">
                            BAGS<span className="text-fg-soft">/</span>TERM
                        </span>
                    </Link>

                    <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-current={isActive ? "page" : undefined}
                                    className={`rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] transition-colors relative group focus-ring ${isActive
                                            ? "bg-white/5 text-white"
                                            : "text-fg-soft hover:text-fg hover:bg-white/5"
                                        }`}
                                >
                                    {item.label}
                                    <span aria-hidden="true" className={`absolute bottom-0 left-3 right-3 h-[1px] rounded-full bg-white/30 transition-all duration-300 origin-left ${isActive
                                            ? "scale-x-100"
                                            : "scale-x-0 group-hover:scale-x-100"
                                        }`} />
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    <LiveDot
                        status="live"
                        size="sm"
                        label={<span className="font-bold tracking-[0.18em]">MAINNET ONLINE</span>}
                        className="hidden md:inline-flex text-[10px]"
                    />
                    <WalletButton />
                </div>
            </div>

            <div className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </header>
    );
}
