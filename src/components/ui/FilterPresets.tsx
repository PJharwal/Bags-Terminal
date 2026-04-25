"use client";

import { useTerminalStore, FILTER_PRESETS } from "@/store/terminal.store";

export function FilterPresets() {
    const { activePreset, setActivePreset, setFilters, resetFilters } = useTerminalStore();

    const handlePresetClick = (presetId: string) => {
        if (activePreset === presetId) {
            // Clicking active preset deactivates it
            resetFilters();
        } else {
            const preset = FILTER_PRESETS.find((p) => p.id === presetId);
            if (preset) {
                setActivePreset(presetId);
                setFilters(preset.filters as Record<string, unknown>);
            }
        }
    };

    return (
        <div className="space-y-2">
            <div className="label">
                Presets
            </div>
            <div className="flex flex-col gap-1">
                {FILTER_PRESETS.map((preset) => (
                    <button
                        key={preset.id}
                        onClick={() => handlePresetClick(preset.id)}
                        className={`btn-press w-full text-left px-3 py-2.5 text-sm transition-all ${activePreset === preset.id
                                ? "bg-acid-green/10 text-acid-green border border-[#39FF14]/20"
                                : "bg-white/[0.02] text-fg-soft hover:bg-white/[0.04] hover:text-fg border border-white/[0.04]"
                            }`}
                    >
                        <div className="font-bold text-xs">{preset.name}</div>
                        <div className="text-meta opacity-60 mt-0.5 font-mono">{preset.description}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}
