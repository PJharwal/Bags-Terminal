"use client";

import { ReactNode } from "react";

interface TerminalLayoutProps {
    leftPanel: ReactNode;
    mainContent: ReactNode;
    rightPanel?: ReactNode;
}

export function TerminalLayout({ leftPanel, mainContent, rightPanel }: TerminalLayoutProps) {
    return (
        <div className="h-[calc(100vh-56px)] flex bg-transparent">
            {/* Left Panel - Filters */}
            <aside className="w-56 flex-shrink-0 border-r border-white/5 bg-[#0B0E14]/50 backdrop-blur-sm overflow-y-auto">
                <div className="p-4">
                    {leftPanel}
                </div>
            </aside>

            {/* Main Content - Table */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#0B0E14]/30">
                {mainContent}
            </main>

            {/* Right Panel - Context (optional, shown on larger screens) */}
            {rightPanel && (
                <aside className="w-80 flex-shrink-0 border-l border-white/5 bg-[#0B0E14]/50 backdrop-blur-sm overflow-y-auto hidden xl:block">
                    <div className="p-4">
                        {rightPanel}
                    </div>
                </aside>
            )}
        </div>
    );
}
