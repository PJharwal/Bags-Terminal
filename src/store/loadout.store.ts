import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Buy-amount loadout for the Pulse quick-buy (⚡) buttons. P1/P2/P3 are editable
// SOL amounts; the active one drives every quick-buy button on the Pulse page.
// (Token tier filtering moved to the toolbar Display menu.)
export type PresetSlot = 'P1' | 'P2' | 'P3';

export const PRESET_SLOTS: PresetSlot[] = ['P1', 'P2', 'P3'];

interface LoadoutState {
  buyPresets: Record<PresetSlot, number>; // SOL amounts
  activePreset: PresetSlot;
  setBuyPreset: (slot: PresetSlot, sol: number) => void;
  setActivePreset: (slot: PresetSlot) => void;
}

export const useLoadoutStore = create<LoadoutState>()(
  persist(
    (set) => ({
      buyPresets: { P1: 0.1, P2: 0.5, P3: 1 },
      activePreset: 'P1',
      setBuyPreset: (slot, sol) =>
        set((s) => ({ buyPresets: { ...s.buyPresets, [slot]: sol } })),
      setActivePreset: (slot) => set({ activePreset: slot }),
    }),
    // skipHydration: rehydrate manually on the client (QuickBuyProvider) so SSR
    // and the first client render both use the defaults — no hydration mismatch.
    { name: 'bags-buy-loadout', skipHydration: true },
  ),
);

// The SOL amount of the currently active preset — what each ⚡ button buys.
export const useActiveBuyAmount = (): number =>
  useLoadoutStore((s) => s.buyPresets[s.activePreset]);
