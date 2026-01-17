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
            <div className="text-xs text-[#9AA0A6] uppercase tracking-wider font-medium">
                Presets
            </div>
            <div className="flex flex-col gap-1">
                {FILTER_PRESETS.map((preset) => (
                    <button
                        key={preset.id}
                        onClick={() => handlePresetClick(preset.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${activePreset === preset.id
                                ? "bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/30"
                                : "bg-white/5 text-[#9AA0A6] hover:bg-white/10 hover:text-white border border-transparent"
                            }`}
                    >
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-[10px] opacity-70 mt-0.5">{preset.description}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}
