"use client";

import { useEffect, useRef, useState } from "react";
import { RiPencilLine, RiFlashlightFill } from "@remixicon/react";
import { useLoadoutStore, PRESET_SLOTS } from "@/store/loadout.store";

// The buy-amount loadout shown in each Pulse column header. P1/P2/P3 are
// editable SOL amounts; clicking one makes it active (drives every ⚡ button),
// the pencil opens an editor to type custom amounts. State is global + persisted.
export function BuyPresetChips() {
  const buyPresets = useLoadoutStore((s) => s.buyPresets);
  const activePreset = useLoadoutStore((s) => s.activePreset);
  const setActivePreset = useLoadoutStore((s) => s.setActivePreset);
  const setBuyPreset = useLoadoutStore((s) => s.setBuyPreset);

  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editing) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setEditing(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [editing]);

  return (
    <div ref={ref} className="relative flex items-center gap-0.5">
      {PRESET_SLOTS.map((slot) => {
        const isActive = slot === activePreset;
        return (
          <button
            key={slot}
            onClick={(e) => {
              e.stopPropagation();
              setActivePreset(slot);
            }}
            title={`${slot}: ${buyPresets[slot]} SOL`}
            className={`flex items-center gap-[2px] px-1 text-[10px] font-bold border-none cursor-pointer bg-transparent transition-colors ${
              isActive ? "text-[#14f195]" : "text-neutral-400 hover:text-white"
            }`}
          >
            {isActive && <RiFlashlightFill className="w-2.5 h-2.5" />}
            {buyPresets[slot]}
          </button>
        );
      })}

      <button
        onClick={(e) => {
          e.stopPropagation();
          setEditing((v) => !v);
        }}
        title="Edit buy presets"
        className="p-0 px-0.5 text-neutral-500 hover:text-white bg-transparent border-none cursor-pointer flex items-center"
      >
        <RiPencilLine className="w-2.5 h-2.5" />
      </button>

      {editing && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-1 z-50 w-40 rounded-md bg-[#101114] border border-[#1d1f26] shadow-lg p-2 flex flex-col gap-1.5"
        >
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            Buy Presets (SOL)
          </div>
          {PRESET_SLOTS.map((slot) => (
            <label
              key={slot}
              className="flex items-center justify-between gap-2 text-[11px] text-white"
            >
              <span className="w-5 text-neutral-400">{slot}</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={buyPresets[slot]}
                onChange={(e) => {
                  const raw = e.target.value;
                  const v = raw === "" ? 0 : parseFloat(raw);
                  setBuyPreset(slot, Number.isFinite(v) && v >= 0 ? v : 0);
                }}
                className="flex-1 w-full bg-[#16161e] border border-[#27272a] rounded px-1.5 py-0.5 text-white text-[11px] outline-none focus:border-[#14f195]"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
