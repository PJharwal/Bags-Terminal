"use client";

import { useEffect, useRef, useState } from "react";
import { RiEqualizer3Line, RiCloseLine, RiCheckLine } from "@remixicon/react";
import {
  usePulseStore,
  hasActiveFilters,
  defaultAdvancedFilters,
  type PulseFilters,
  type FilterRange,
  type TierFilter,
} from "@/store/pulse.store";
import type { PulseState } from "@/lib/types";

const PROTOCOLS = [
  { key: "pump", label: "Pump.fun" },
  { key: "bonk", label: "Bonk" },
  { key: "meteora", label: "Meteora" },
  { key: "bags", label: "Bags" },
];

const TIERS: { label: string; value: TierFilter }[] = [
  { label: "All", value: "all" },
  { label: "High", value: "high" },
  { label: "Med", value: "medium" },
  { label: "Low", value: "low" },
];

const GENERAL_RANGES: { label: string; key: "mcap" | "volume" | "liquidity" | "holders" | "txns" }[] = [
  { label: "Market Cap ($)", key: "mcap" },
  { label: "Volume ($)", key: "volume" },
  { label: "Liquidity ($)", key: "liquidity" },
  { label: "Holders", key: "holders" },
  { label: "TXNS", key: "txns" },
];

const AGE_UNIT_SEC = { m: 60, h: 3600, d: 86400 } as const;
type AgeUnit = keyof typeof AGE_UNIT_SEC;

type RangeDraft = { min: string; max: string };
interface Draft {
  search: string;
  exclude: string;
  protocols: string[];
  tierFilter: TierFilter;
  hideRisky: boolean;
  bagsOnly: boolean;
  mcap: RangeDraft;
  volume: RangeDraft;
  liquidity: RangeDraft;
  holders: RangeDraft;
  txns: RangeDraft;
  ageMin: string;
  ageMax: string;
  ageUnit: AgeUnit;
}

const numToStr = (n: number | null) => (n == null ? "" : String(n));
const strToNum = (s: string): number | null => {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};
const rangeToDraft = (r: FilterRange): RangeDraft => ({ min: numToStr(r.min), max: numToStr(r.max) });
const draftToRange = (d: RangeDraft): FilterRange => ({ min: strToNum(d.min), max: strToNum(d.max) });

function buildDraft(f: PulseFilters): Draft {
  return {
    search: f.search,
    exclude: f.exclude,
    protocols: [...f.protocols],
    tierFilter: f.tierFilter,
    hideRisky: f.hideRisky,
    bagsOnly: f.bagsOnly,
    mcap: rangeToDraft(f.mcap),
    volume: rangeToDraft(f.volume),
    liquidity: rangeToDraft(f.liquidity),
    holders: rangeToDraft(f.holders),
    txns: rangeToDraft(f.txns),
    // age stored in seconds; display in minutes by default
    ageMin: f.ageSec.min == null ? "" : String(f.ageSec.min / 60),
    ageMax: f.ageSec.max == null ? "" : String(f.ageSec.max / 60),
    ageUnit: "m",
  };
}

const INPUT_CLS =
  "flex-1 min-w-0 w-full bg-[#16161e] border border-[#27272a] rounded-md px-2 py-1.5 text-[11px] text-white placeholder:text-white/30 outline-none focus:border-[#14f195] transition-colors";

export function PulseFilterButton({ state }: { state: PulseState }) {
  const filters = usePulseStore((s) => s.filters[state]);
  const setFilters = usePulseStore((s) => s.setFilters);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => buildDraft(filters));
  const ref = useRef<HTMLDivElement>(null);

  const active = hasActiveFilters(filters);

  // Re-seed the draft from the live filters each time the popover opens.
  const openPopover = () => {
    setDraft(buildDraft(usePulseStore.getState().filters[state]));
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const patch = (u: Partial<Draft>) => setDraft((d) => ({ ...d, ...u }));
  const patchRange = (key: "mcap" | "volume" | "liquidity" | "holders" | "txns", side: "min" | "max", v: string) =>
    setDraft((d) => ({ ...d, [key]: { ...d[key], [side]: v } }));

  const toggleProtocol = (key: string) =>
    setDraft((d) => ({
      ...d,
      protocols: d.protocols.includes(key)
        ? d.protocols.filter((k) => k !== key)
        : [...d.protocols, key],
    }));

  const apply = () => {
    const factor = AGE_UNIT_SEC[draft.ageUnit];
    const ageNum = (s: string) => {
      const n = strToNum(s);
      return n == null ? null : n * factor;
    };
    setFilters(state, {
      search: draft.search,
      exclude: draft.exclude,
      protocols: draft.protocols,
      tierFilter: draft.tierFilter,
      hideRisky: draft.hideRisky,
      bagsOnly: draft.bagsOnly,
      mcap: draftToRange(draft.mcap),
      volume: draftToRange(draft.volume),
      liquidity: draftToRange(draft.liquidity),
      holders: draftToRange(draft.holders),
      txns: draftToRange(draft.txns),
      ageSec: { min: ageNum(draft.ageMin), max: ageNum(draft.ageMax) },
    });
    setOpen(false);
  };

  const reset = () => {
    const adv = defaultAdvancedFilters();
    setFilters(state, { ...adv, tierFilter: "all", hideRisky: false, bagsOnly: false, minMarketCap: 0 });
    setDraft(buildDraft({ ...filters, ...adv, tierFilter: "all", hideRisky: false, bagsOnly: false }));
  };

  const checkbox = (checked: boolean) => (
    <div
      className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
        checked ? "bg-[#14f195] border-[#14f195]" : "bg-transparent border-[#2a3038]"
      }`}
    >
      {checked && <RiCheckLine className="w-2.5 h-2.5 text-black" />}
    </div>
  );

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        onClick={(e) => {
          e.stopPropagation();
          open ? setOpen(false) : openPopover();
        }}
        className={`relative p-1 bg-none border-none cursor-pointer flex items-center transition-colors ${
          active || open ? "text-[#14f195]" : "text-neutral-400 hover:text-white"
        }`}
        title="Filters"
      >
        <RiEqualizer3Line className="w-[12px] h-[12px]" />
        <span
          className={`absolute -top-0 -right-0.5 h-1 w-1 rounded-full ${
            active ? "bg-[#14f195]" : "bg-[#526fff]"
          }`}
        />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-1 z-50 w-[300px] max-w-[calc(100vw-1.5rem)] max-h-[72vh] rounded-lg bg-[#0b0d10] border border-[#1d1f26] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#1e222a] shrink-0">
            <span className="text-[13px] font-bold text-white">Filters</span>
            <button
              onClick={() => setOpen(false)}
              className="w-5 h-5 flex items-center justify-center text-white/40 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
            >
              <RiCloseLine className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4" style={{ scrollbarWidth: "thin" }}>
            {/* Keywords */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-white/60 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="kw1, kw2…"
                  value={draft.search}
                  onChange={(e) => patch({ search: e.target.value })}
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-white/60 mb-1">Exclude</label>
                <input
                  type="text"
                  placeholder="kw1, kw2…"
                  value={draft.exclude}
                  onChange={(e) => patch({ exclude: e.target.value })}
                  className={INPUT_CLS}
                />
              </div>
            </div>

            {/* Protocols */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold text-white/80">PROTOCOLS</label>
                <button
                  onClick={() => patch({ protocols: draft.protocols.length ? [] : PROTOCOLS.map((p) => p.key) })}
                  className="text-[10px] text-white/60 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                >
                  {draft.protocols.length ? "Unselect All" : "Select All"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {PROTOCOLS.map((p) => {
                  const sel = draft.protocols.includes(p.key);
                  return (
                    <button
                      key={p.key}
                      onClick={() => toggleProtocol(p.key)}
                      className="flex items-center gap-2 text-left bg-transparent border-none cursor-pointer p-0"
                    >
                      {checkbox(sel)}
                      <span className={`text-[11px] font-medium ${sel ? "text-white" : "text-white/40"}`}>
                        {p.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tier */}
            <div>
              <label className="block text-[11px] font-semibold text-white/80 mb-1.5">Tier</label>
              <div className="grid grid-cols-4 gap-1">
                {TIERS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => patch({ tierFilter: t.value })}
                    className={`py-1 text-[10px] rounded border transition-colors cursor-pointer ${
                      draft.tierFilter === t.value
                        ? "bg-[#14f195] text-black border-[#14f195] font-semibold"
                        : "bg-[#16161e] text-white border-[#27272a] hover:border-neutral-500"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Numeric ranges */}
            {GENERAL_RANGES.map((r) => (
              <div key={r.key}>
                <label className="block text-[11px] font-medium text-white/80 mb-1.5">{r.label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={draft[r.key].min}
                    onChange={(e) => patchRange(r.key, "min", e.target.value)}
                    className={INPUT_CLS}
                  />
                  <span className="text-[10px] text-white/40 shrink-0">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={draft[r.key].max}
                    onChange={(e) => patchRange(r.key, "max", e.target.value)}
                    className={INPUT_CLS}
                  />
                </div>
              </div>
            ))}

            {/* Age */}
            <div>
              <label className="block text-[11px] font-medium text-white/80 mb-1.5">Age</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={draft.ageMin}
                  onChange={(e) => patch({ ageMin: e.target.value })}
                  className={INPUT_CLS}
                />
                <span className="text-[10px] text-white/40 shrink-0">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={draft.ageMax}
                  onChange={(e) => patch({ ageMax: e.target.value })}
                  className={INPUT_CLS}
                />
                <select
                  value={draft.ageUnit}
                  onChange={(e) => patch({ ageUnit: e.target.value as AgeUnit })}
                  className="shrink-0 bg-[#16161e] border border-[#27272a] rounded-md px-1.5 py-1.5 text-[11px] text-white outline-none focus:border-[#14f195] w-[34px] text-center appearance-none cursor-pointer"
                >
                  <option value="m">m</option>
                  <option value="h">h</option>
                  <option value="d">d</option>
                </select>
              </div>
            </div>

            {/* Toggles */}
            <div className="pt-1 border-t border-[#1e222a] space-y-2.5">
              <button
                onClick={() => patch({ hideRisky: !draft.hideRisky })}
                className="flex items-center gap-2 w-full bg-transparent border-none cursor-pointer p-0"
              >
                {checkbox(draft.hideRisky)}
                <span className={`text-[11px] font-medium ${draft.hideRisky ? "text-white" : "text-white/40"}`}>
                  Hide risky pairs
                </span>
              </button>
              <button
                onClick={() => patch({ bagsOnly: !draft.bagsOnly })}
                className="flex items-center gap-2 w-full bg-transparent border-none cursor-pointer p-0"
              >
                {checkbox(draft.bagsOnly)}
                <span className={`text-[11px] font-medium ${draft.bagsOnly ? "text-white" : "text-white/40"}`}>
                  BAGS tokens only
                </span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 p-2.5 border-t border-[#1e222a] shrink-0">
            <button
              onClick={reset}
              className="flex-1 py-1.5 text-[12px] font-medium text-white/70 border border-[#27272a] rounded-lg hover:bg-white/[0.05] transition-colors bg-transparent cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={apply}
              className="flex-1 py-1.5 text-[12px] font-semibold text-black rounded-lg bg-[#14f195] hover:brightness-95 transition-all border-none cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
