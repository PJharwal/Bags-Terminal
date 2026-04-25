"use client";

import { BarChart2, Settings, Maximize2, Grid3X3, Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function TerminalToolbar() {
    return (
        <div className="flex flex-col items-center gap-1 py-2 px-1 bg-[#0A0A0A] border-r border-white/10">
            <ToolbarButton icon={<BarChart2 size={16} />} title="Indicators" />
            <ToolbarButton icon={<Grid3X3 size={16} />} title="Layout" />
            <ToolbarButton icon={<Bell size={16} />} title="Alerts" />

            <div role="separator" className="my-2 w-full h-px bg-white/10" />

            <ToolbarButton icon={<Maximize2 size={16} />} title="Fullscreen" />
            <ToolbarButton icon={<Settings size={16} />} title="Settings" />
        </div>
    );
}

function ToolbarButton({ icon, title, active = false }: { icon: React.ReactNode; title: string; active?: boolean }) {
    return (
        <Button
            variant="bare"
            size="sm"
            iconLeft={icon}
            title={title}
            aria-label={title}
            aria-pressed={active || undefined}
            className={active ? "bg-acid-green/20 text-acid-green" : "hover:bg-white/5"}
        />
    );
}
