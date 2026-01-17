import { create } from 'zustand';

interface SelectionState {
    selectedTokenId: string | null;
    hoveredTokenId: string | null;
    drawerOpen: boolean;
    drawerSource: 'pulse' | 'terminal' | null;
}

interface SelectionActions {
    selectToken: (tokenId: string | null, source?: 'pulse' | 'terminal') => void;
    hoverToken: (tokenId: string | null) => void;
    closeDrawer: () => void;
}

export const useSelectionStore = create<SelectionState & SelectionActions>((set) => ({
    selectedTokenId: null,
    hoveredTokenId: null,
    drawerOpen: false,
    drawerSource: null,

    selectToken: (tokenId, source = 'terminal') => set({
        selectedTokenId: tokenId,
        drawerOpen: tokenId !== null,
        drawerSource: tokenId ? source : null,
    }),

    hoverToken: (tokenId) => set({
        hoveredTokenId: tokenId,
    }),

    closeDrawer: () => set({
        drawerOpen: false,
        drawerSource: null,
    }),
}));
