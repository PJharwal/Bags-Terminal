"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Terminal, Bell } from "lucide-react";
import { WalletButton } from "@/components/wallet/WalletButton";

const navItems = [
    { href: "/", label: "HOME" },
    { href: "/terminal", label: "TERMINAL" },
    { href: "/launch", label: "LAUNCH" },
    { href: "/creator", label: "CREATOR" },
    { href: "/pulse", label: "PULSE" },
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
            className={`h-14 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b ${scrolled
                    ? "bg-[#050505] border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                    : "bg-[#050505] border-white/10"
                } font-mono`}
        >
            {/* Logo & Nav */}
            <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-8 h-8 bg-[#EDEDED] flex items-center justify-center group-hover:bg-[#39FF14] transition-colors duration-75">
                        <Terminal size={18} strokeWidth={2.5} className="text-black" />
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
                            <div className={`absolute bottom-0 left-4 right-4 h-[1px] bg-[#39FF14] transition-transform duration-200 origin-left ${pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                                    ? "scale-x-100"
                                    : "scale-x-0 group-hover:scale-x-100"
                                }`} />
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-6">
                {/* Network Status */}
                <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#39FF14]">
                    <div className="flex gap-0.5">
                       {[1, 2, 3].map(i => (
                         <div key={i} className={`w-[2px] h-2 bg-[#39FF14] ${i === 3 ? 'animate-pulse' : ''}`} />
                       ))}
                    </div>
                    MAINNET<span className="text-[#444]">_</span>ONLINE
                </div>

                {/* System Controls */}
                <div className="flex items-center gap-2">
                    <button className="p-2 text-[#888] hover:text-[#FF003C] transition-colors relative group">
                        <Bell size={16} />
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#FF003C] group-hover:animate-ping" />
                    </button>

                    <WalletButton />
                </div>
            </div>

            {/* Top Scanning Line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#39FF14]/30 to-transparent opacity-50" />
        </header>
    );
}
