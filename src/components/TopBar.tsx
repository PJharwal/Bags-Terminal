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
            className={`accent-line-top h-14 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled
                    ? "glass-heavy border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                    : "bg-[#050505] border-white/10"
                } font-mono`}
        >
            {/* Logo & Nav */}
            <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-3 group focus-ring">
                    <BagsLogo size={20} className="text-acid-green transition-transform duration-150 group-hover:scale-110" />
                    <span className="text-sm font-display font-bold tracking-tighter group-hover:text-acid-green transition-colors">
                        BAGS<span className="text-fg-soft">_</span>TERM
                    </span>
                </Link>

                <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={isActive ? "page" : undefined}
                                className={`px-4 py-1.5 text-meta font-bold tracking-widest transition-all relative group focus-ring ${isActive
                                        ? "text-acid-green"
                                        : "text-fg-soft hover:text-fg"
                                    }`}
                            >
                                {item.label}
                                <span aria-hidden="true" className={`absolute bottom-0 left-4 right-4 h-[1px] bg-acid-green transition-all duration-300 origin-left ${isActive
                                        ? "scale-x-100"
                                        : "scale-x-0 group-hover:scale-x-100"
                                    }`} />
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-6">
                {/* Network Status */}
                <LiveDot
                    status="live"
                    size="sm"
                    label={<span className="font-bold tracking-widest">MAINNET<span aria-hidden="true" className="text-muted">_</span>ONLINE</span>}
                    className="hidden sm:inline-flex"
                />

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
