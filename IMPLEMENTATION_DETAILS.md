# Implementation Details: Omenera Integration & Skill Architecture

**Date:** January 19, 2026
**Status:** Phase 1 Integration Complete

## Overview
This document details the integration of `omnera-frontend-main` functionality into the `bags-terminal` application. We have adopted a **Module-Based "Skill" Architecture**, restructuring the application into distinct functional areas (Discover, Analyze, Track, Execute) and porting key analysis capabilities.

## 1. Architecture: Module-Based Navigation
We moved away from a simple page-based structure to a robust module system.

*   **New Navigation Component:** `src/components/terminal/ModuleNavigation.tsx`
    *   **Style:** Brutalist/Terminal (Neon Green active states, sharp borders).
    *   **Modules:**
        *   `DISCOVER`: (Placeholder) for finding new tokens.
        *   `ANALYZE`: (Implemented) Deep dive token analytics.
        *   `TRACK`: (Placeholder) Portfolio and wallet tracking.
        *   `EXECUTE`: (Placeholder) Trading interface.
*   **Layout Integration:** Updated `src/app/layout.tsx` to include `ModuleNavigation` globally, ensuring consistent navigation across all terminal views.
*   **Routing:** Established route groups in `src/app/` for each module.

## 2. Ported "Skill" Components (Omenera -> Bags Terminal)
We successfully ported and restyled three core components from the Omenera frontend to the `ANALYZE` module.

### A. Token Audit (`src/components/modules/analyze/TokenAudit.tsx`)
*   **Source:** `omnera-frontend-main/src/components/token/TokenAudit.tsx`
*   **Functionality:**
    *   Analyzes token risk metrics (Snipers, Bundlers, Fresh Wallets, Dev Count).
    *   Calculates a composite "Risk Score" (0-100).
    *   Visualizes safety levels (Safe, Warning, Danger).
*   **Design Updates:**
    *   Converted Tailwind colors to CSS variables (e.g., `text-green-400` -> `text-[#39FF14]`).
    *   Replaced rounded corners with sharp edges (`rounded-none`).
    *   Applied `Space Mono` font for data and `Syncopate` for headers.

### B. Holders Table (`src/components/modules/analyze/HoldersTable.tsx`)
*   **Source:** `omnera-frontend-main/src/components/token/HoldersTable.tsx`
*   **Functionality:**
    *   Lists top token holders.
    *   Displays balance, USD value, percentage held.
    *   Shows wallet tags (e.g., "Sniper", "Dev", "Whale").
*   **Design Updates:**
    *    implemented "Scanline" table aesthetics.
    *   High-contrast borders and headers.
    *   Tag styling updated to bordered, uppercase pills.

### C. Traders Table (`src/components/modules/analyze/TradersTable.tsx`)
*   **Source:** `omnera-frontend-main/src/components/token/TradersTable.tsx`
*   **Functionality:**
    *   Tracks top trader performance.
    *   Displays PnL (Realized/Unrealized), Volume, and Tags.
    *   Color-coded PnL (Neon Green/Red).
*   **Design Updates:**
    *   Consistent table styling with `HoldersTable`.
    *   Numeric formatting aligned with terminal aesthetics.

## 3. Data Structures (`src/types/token.ts`)
We established a shared type definition file to ensure compatibility between the ported components and the application state.
*   **Key Interfaces:** `TokenStatsData`, `HolderData`, `TraderData`, `TokenInfoData`.

## 4. Real-time Data: WebSocket Integration
We have successfully integrated the WebSocket layer to power real-time updates across the application.

*   **Global Store:** `src/store/socket.store.ts` (Zustand)
    *   Manages connection state and data streams.
    *   Subscribes to default rooms (`new_tokens:all`, `trades:all`).
    *   Maintains rolling buffers for tokens and trades.
*   **Initialization:** `src/components/terminal/SocketInitializer.tsx`
    *   Handles connection lifecycle on app mount.
    *   Integrated into `src/app/layout.tsx`.
*   **Types:** `src/types/socket.ts`
    *   Ported `NewTokenEvent`, `TradeEvent`, `MigrationEvent` from Omenera for full compatibility.

## 5. Styling & Theming
*   **Global Utils:** Created `src/lib/utils.ts` for `cn` (class merging).
*   **Design System Compliance:** All new components strictly adhere to the "Brutalist Precision" theme defined in `UI_OVERHAUL_REPORT.md`.

## Next Steps
1.  **Connect Real Data:** Replace dummy data in `src/app/analyze/page.tsx` with live API calls.
2.  **Implement DISCOVER:** Port trending/feed components to the Discover module.
3.  **Implement EXECUTE:** Integrate Turnkey wallet functionality (from Omenera `src/lib/turnkey`) into the Execute module.
4.  **Visualize Live Feeds:** Create components to display the real-time data flowing into `socket.store.ts`.
