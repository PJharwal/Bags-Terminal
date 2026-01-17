"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTerminalStore } from "@/store/terminal.store";
import { X } from "lucide-react";

interface DrawerShellProps {
    children: React.ReactNode;
    title?: string;
    width?: "sm" | "md" | "lg";
}

export function DrawerShell({ children, title, width = "md" }: DrawerShellProps) {
    const { drawerOpen, closeDrawer } = useTerminalStore();
    const drawerRef = useRef<HTMLDivElement>(null);

    const widthClasses = {
        sm: "w-80",
        md: "w-[400px]",
        lg: "w-[480px]",
    };

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && drawerOpen) {
                closeDrawer();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [drawerOpen, closeDrawer]);

    return (
        <AnimatePresence>
            {drawerOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeDrawer}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    />

                    {/* Drawer */}
                    <motion.div
                        ref={drawerRef}
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className={`fixed top-14 right-0 h-[calc(100vh-56px)] ${widthClasses[width]} bg-[#080808] border-l border-white/10 z-50 flex flex-col font-mono shadow-2xl`}
                    >
                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0A0A0A]">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[#EDEDED]">{title}</h3>
                                <button
                                    onClick={closeDrawer}
                                    className="p-1 text-[#666] hover:text-[#EDEDED] border border-transparent hover:border-[#333] transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}