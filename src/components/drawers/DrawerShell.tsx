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
                        className={`fixed top-14 right-0 h-[calc(100vh-56px)] ${widthClasses[width]} glass-heavy border-l border-white/[0.06] z-50 flex flex-col font-mono shadow-[0_0_60px_rgba(0,0,0,0.8)]`}
                    >
                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] gradient-border relative">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-fg">{title}</h3>
                                <button
                                    onClick={closeDrawer}
                                    className="btn-ghost p-1.5 text-muted-high hover:text-fg"
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