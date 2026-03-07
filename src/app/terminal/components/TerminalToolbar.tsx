"use client";

import { BarChart2, Settings, Maximize2, Grid3X3, Bell } from "lucide-react";

export function TerminalToolbar() {
    return (
        <div className="flex flex-col items-center gap-1 py-2 px-1 bg-[#0A0A0A] border-r border-white/10">
            <ToolbarButton icon={<BarChart2 size={16} />} title="Indicators" />
            <ToolbarButton icon={<Grid3X3 size={16} />} title="Layout" />
            <ToolbarButton icon={<Bell size={16} />} title="Alerts" />

            <div className="my-2 w-full h-px bg-white/10" />

            <ToolbarButton icon={<Maximize2 size={16} />} title="Fullscreen" />
            <ToolbarButton icon={<Settings size={16} />} title="Settings" />
        </div>
    );
}

function ToolbarButton({ icon, title, active = false }: { icon: React.ReactNode; title: string; active?: boolean }) {
    return (
        <button
            className={`p-2 transition-colors ${active
                    ? 'bg-[#39FF14]/20 text-[#39FF14]'
                    : 'text-[#666] hover:text-[#EDEDED] hover:bg-white/5'
                }`}
            title={title}
        >
            {icon}
        </button>
    );
}
