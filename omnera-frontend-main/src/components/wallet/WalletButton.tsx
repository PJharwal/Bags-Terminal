"use client";

import { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ChevronDown, LogOut, Wallet } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export const WalletButton: FC = () => {
    const { publicKey, disconnect, connecting } = useWallet();
    const { setVisible } = useWalletModal();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleConnect = () => {
        setVisible(true);
    };

    const handleDisconnect = async () => {
        await disconnect();
        setShowDropdown(false);
    };

    const copyAddress = () => {
        if (publicKey) {
            navigator.clipboard.writeText(publicKey.toBase58());
            setShowDropdown(false);
        }
    };

    if (connecting) {
        return (
            <button
                disabled
                className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary opacity-50 cursor-not-allowed"
            >
                Connecting...
            </button>
        );
    }

    if (publicKey) {
        const address = publicKey.toBase58();
        const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;

        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                    <Wallet size={16} />
                    {shortAddress}
                    <ChevronDown size={14} className={`transition-transform ${showDropdown ? "rotate-180" : ""}`} />
                </button>

                {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-surface shadow-lg z-50">
                        <div className="p-2">
                            <button
                                onClick={copyAddress}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-white hover:bg-white/5 rounded-md transition-colors"
                            >
                                Copy Address
                            </button>
                            <button
                                onClick={handleDisconnect}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 rounded-md transition-colors"
                            >
                                <LogOut size={14} />
                                Disconnect
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <button
            onClick={handleConnect}
            className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
        >
            Connect Wallet
        </button>
    );
};
