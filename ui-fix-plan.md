# Bags-Terminal — UI Fix Plan

Companion to `ui-audit.md`. For each finding, this doc gives the exact file-level change (before/after), the dependency order, and verification notes.

Scope: UI only. **No backend, state, wallet, security changes.**

Existing helpers to reuse (confirmed):
- `src/lib/format.ts` — `formatWallet(address, length=4)`, `formatNumber`, `formatCurrency`, `formatPercent`, `formatTimeAgo`.
- `src/lib/utils.ts` — `cn`.
- `src/components/ui/ErrorBoundary.tsx` — class component, accepts `children` + optional `fallbackMessage` (unused today).
- Radix packages installed: `@radix-ui/react-dialog`, `@radix-ui/react-popover`, `@radix-ui/react-tooltip` (zero imports).

---

## Phase 0 — Foundation (do first; unblocks everything else)

### 0.1 — Extend `@theme` in `src/app/globals.css`

Add orphan neutrals + z-index scale to the existing `@theme` block (top of file).

```diff
@theme {
  --color-bg-primary: #050505;
  --color-bg-secondary: #0A0A0A;
  --color-bg-tertiary: #111111;
+ --color-bg-elevated: #1A1A1A;            /* 46x usage */

  --color-border-raw: rgba(255, 255, 255, 0.08);
  --color-border-active: rgba(255, 255, 255, 0.2);

  --color-text-primary: #EDEDED;
  --color-text-secondary: #888888;
  --color-text-muted: #444444;
+ --color-text-muted-high: #666666;        /* 291x usage */
+ --color-text-muted-mid: #555555;         /* 41x usage */

  /* Radical Accents */
  --color-acid-green: #39FF14;
  /* ... unchanged ... */

+ /* Stacking scale */
+ --z-sticky: 20;
+ --z-popover: 40;
+ --z-modal: 50;
+ --z-toast: 60;
}
```

Also add a numeric utility class near the existing utility section:

```css
.num { font-variant-numeric: tabular-nums; }
```

### 0.2 — Create shared primitives

`src/components/ui/Dialog.tsx` and `src/components/ui/Popover.tsx`. Keep thin — design tokens baked in once, Radix does the rest.

```tsx
// src/components/ui/Dialog.tsx
"use client";
import * as RadixDialog from "@radix-ui/react-dialog";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;
export const DialogTitle = RadixDialog.Title;
export const DialogDescription = RadixDialog.Description;

export const DialogContent = forwardRef<
  React.ElementRef<typeof RadixDialog.Content>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Content> & { children: ReactNode }
>(({ className, children, ...props }, ref) => (
  <RadixDialog.Portal>
    <RadixDialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" style={{ zIndex: "var(--z-modal)" }} />
    <RadixDialog.Content
      ref={ref}
      style={{ zIndex: "var(--z-modal)" }}
      className={cn(
        "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-raw)] focus:outline-none focus-visible:outline-[var(--color-acid-green)]",
        className,
      )}
      {...props}
    >
      {children}
    </RadixDialog.Content>
  </RadixDialog.Portal>
));
DialogContent.displayName = "DialogContent";
```

```tsx
// src/components/ui/Popover.tsx
"use client";
import * as RadixPopover from "@radix-ui/react-popover";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;
export const PopoverAnchor = RadixPopover.Anchor;

export const PopoverContent = forwardRef<
  React.ElementRef<typeof RadixPopover.Content>,
  React.ComponentPropsWithoutRef<typeof RadixPopover.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <RadixPopover.Portal>
    <RadixPopover.Content
      ref={ref}
      sideOffset={sideOffset}
      style={{ zIndex: "var(--z-popover)" }}
      className={cn(
        "bg-[var(--color-bg-secondary)] border border-[var(--color-border-raw)] focus:outline-none",
        className,
      )}
      {...props}
    />
  </RadixPopover.Portal>
));
PopoverContent.displayName = "PopoverContent";
```

### 0.3 — Wire `ErrorBoundary` into `src/app/layout.tsx`

```diff
 import type { Metadata } from "next";
 import "./globals.css";
 import TopBar from "@/components/TopBar";
 import SocketInitializer from "@/components/terminal/SocketInitializer";
 import { WalletProviderWrapper } from "@/components/wallet/WalletProviderWrapper";
 import { TurnkeyProvider } from "@/components/turnkey/TurnkeyProvider";
 import { ToastContainer } from "@/components/ui/Toast";
+import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

 export default function RootLayout({ children }) {
   return (
     <html lang="en" className="dark">
       <body className="antialiased text-[#EDEDED]">
+        <ErrorBoundary fallbackMessage="App initialization failed">
           <WalletProviderWrapper>
             <TurnkeyProvider>
               <TopBar />
               <main className="min-h-screen pt-14 flex flex-col">
                 <SocketInitializer />
                 <div className="flex-1">{children}</div>
               </main>
               <ToastContainer />
             </TurnkeyProvider>
           </WalletProviderWrapper>
+        </ErrorBoundary>
       </body>
     </html>
   );
 }
```

`app/error.tsx` still handles per-route errors; the new boundary catches provider-mount crashes.

---

## Phase 1 — Critical user-visible fixes

### C-1 · `src/components/tables/DataTable.tsx`

**Add import:**
```ts
import { formatWallet } from "@/lib/format";
```

**Line 20** — table minimum width so `overflow-x` wrapper has something to scroll:
```diff
- <table className="w-full text-sm border-collapse relative z-10">
+ <table className="w-full min-w-[800px] text-sm border-collapse relative z-10">
```

**Line 59** — replace raw address:
```diff
- <span className="font-mono text-[10px] text-[#666]">{token.deployer_wallet}</span>
+ <span className="font-mono text-[10px] text-[#666]" title={token.deployer_wallet}>
+   {formatWallet(token.deployer_wallet, 4)}
+ </span>
```

**Line 89** — live status with glyph + SR text:
```diff
- <span className={`text-[10px] font-mono uppercase tracking-wider ${
-   token.status === 'live' ? 'text-[#39FF14] animate-pulse' :
-   token.status === 'rugged' ? 'text-[#FF003C]' : 'text-[#888]'
- }`}>
-   {token.status}
- </span>
+ <span
+   className={`text-[10px] font-mono uppercase tracking-wider inline-flex items-center gap-1 ${
+     token.status === 'live' ? 'text-[#39FF14] animate-pulse' :
+     token.status === 'rugged' ? 'text-[#FF003C]' : 'text-[#888]'
+   }`}
+   role="status"
+   aria-label={`Status: ${token.status}`}
+ >
+   <span aria-hidden="true">
+     {token.status === 'live' ? '●' : token.status === 'rugged' ? '✕' : '◯'}
+   </span>
+   {token.status}
+ </span>
```

**Lines 98-109** — add `num` to every numeric cell's `className`:
```diff
- <span className="font-mono text-xs text-[#888] group-hover:text-[#EDEDED]">
+ <span className="font-mono text-xs text-[#888] group-hover:text-[#EDEDED] num">
```

### C-2 · `src/app/terminal/components/TerminalHeader.tsx`

**Line 84:**
```diff
- <span className="text-sm font-bold text-[#EDEDED]">{token.symbol}</span>
+ <span className="text-sm font-bold text-[#EDEDED] truncate max-w-[120px]" title={token.symbol}>
+   {token.symbol}
+ </span>
```

**Lines 114-119** — add `num`:
```diff
- <span className="text-sm font-bold text-[#EDEDED]">
+ <span className="text-sm font-bold text-[#EDEDED] num">
    ${formatPrice(token.priceUsd)}
  </span>
- <span className={`text-[10px] font-mono ${changeColor}`}>
+ <span className={`text-[10px] font-mono num ${changeColor}`}>
    {priceChangeSign}{token.priceChange24h.toFixed(1)}%
  </span>
```

### C-3 · DataTable horizontal scroll
Covered by `min-w-[800px]` in C-1. The parent `<div className="flex-1 overflow-auto">` at line 16 already scrolls both axes — no parent change needed.

### C-4 · Numeric jitter
Covered by `.num` utility added in Phase 0 + class applications in C-1 and C-2.

### C-5 · `src/app/pulse/page.tsx` line 536
```diff
- <col.icon size={20} className="text-[#222]" />
+ <col.icon size={20} className="text-white/30" aria-hidden="true" />
```

---

## Phase 2 — a11y pass

### H-2/L-1 · `src/components/TopBar.tsx`

**Line 51 (nav):**
```diff
- <nav className="hidden md:flex items-center gap-1">
+ <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
```

**Lines 74-80 (network status):**
```diff
- <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#39FF14]">
-   <div className="flex gap-0.5">
+ <div
+   className="hidden sm:flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#39FF14]"
+   role="status"
+   aria-live="polite"
+   aria-label="Mainnet online"
+ >
+   <div className="flex gap-0.5" aria-hidden="true">
    {[1, 2, 3].map(i => (
      <div key={i} className={`w-[2px] bg-[#39FF14]/70 ${i === 1 ? 'h-1' : i === 2 ? 'h-1.5' : 'h-2 animate-pulse'}`} />
    ))}
  </div>
  MAINNET<span className="text-[#444]">_</span>ONLINE
</div>
```

### H-2 · `src/components/ui/StatusBadge.tsx` lines 25-34
```diff
  return (
    <span
      className={`badge ${sizeClasses[size]} ${getStatusBgColor(status)} ${getStatusColor(status)} font-medium`}
+     role={status === 'live' ? 'status' : 'img'}
+     aria-label={`Token status: ${statusLabels[status]}`}
    >
      {status === 'live' && (
-       <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
+       <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" aria-hidden="true" />
      )}
      {statusLabels[status]}
    </span>
  );
```

### H-3 · Color-only signals in `PulseColumn.tsx` (around line 518)
Apply the same glyph + SR pattern used in C-1 (DataTable). Read the local context first; the exact JSX there is a simple `<span className="text-[#39FF14]">` conveying "live."

### H-4 · `src/components/ui/Toast.tsx` line 75-78
```diff
  <button
    onClick={() => removeToast(t.id)}
-   className="text-[#666] hover:text-[#EDEDED] transition-colors duration-100 hover:scale-110 active:scale-90"
+   className="flex items-center justify-center w-6 h-6 -mr-1 text-[#666] hover:text-[#EDEDED] transition-colors duration-100 hover:scale-110 active:scale-90"
+   aria-label="Close notification"
  >
    <X size={10} />
  </button>
```

Also add `role="status" aria-live="polite"` to the `<ToastContainer>` outer wrapper so new toasts are announced.

### H-6 · Form label associations
Example — `src/components/terminal/SlippageSettings.tsx` line 72 (and pattern for all 19 unassociated labels):
```diff
- <span className="text-[9px] uppercase text-[#666]">Custom (%)</span>
- <input type="number" value={customSlippage} onChange={e => setCustomSlippage(e.target.value)} ... />
+ <label className="text-[9px] uppercase text-[#666]" htmlFor="slippage-custom">Custom (%)</label>
+ <input id="slippage-custom" type="number" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" value={customSlippage} onChange={e => setCustomSlippage(e.target.value)} ... />
```

Repeat pattern for `TokenAdminTab.tsx`, `LaunchTokenForm.tsx`, `BagsTokensSection.tsx`, and any other `<label>` without `htmlFor`.

### H-7 · Numeric inputs in `TerminalTradePanel.tsx` lines 309, 327
```diff
  <input
    type="number"
    value={solAmount}
-   onChange={(e) => setSolAmount(e.target.value)}
+   onChange={(e) => setSolAmount(e.target.value.replace(/[^0-9.]/g, ""))}
+   inputMode="decimal"
+   pattern="[0-9]*\.?[0-9]*"
    className="..."
    placeholder="0.00" step="0.1" min="0"
  />
```

### H-10 · `src/components/share/useShareCard.ts`
When rendering the share PNG, also expose a hidden text summary adjacent to the download trigger, wired via `aria-describedby`. Leave the canvas itself as-is — the text summary is what SRs read.

### H-11 · `.badge-live` usage
In `src/components/pulse/PulseColumn.tsx:87`, gate the class:
```diff
- <span className="badge badge-live badge-green">
+ <span className={cn("badge badge-green", isLive && "badge-live")}>
```

---

## Phase 3 — Radix migration

### Migration order (easiest → hardest)

| # | File | Type | Preserved state | Notes |
|---|---|---|---|---|
| 1 | `src/components/pulse/PulseColumn.tsx` | Popover | `dropdownOpen`, framer `AnimatePresence` | Trivial; wrap content in `motion.div` under `PopoverContent` |
| 2 | `src/components/turnkey/TurnkeyWalletButton.tsx` | Popover | `showDropdown` | Delete overlay div; Radix handles dismiss |
| 3 | `src/components/terminal/SlippageSettings.tsx` | Popover | `isOpen`, custom input state | Self-contained |
| 4 | `src/components/social/AddSocialLink.tsx` | Popover | `isLinking`, error | |
| 5 | `src/components/launch/AddClaimerForm.tsx` | Popover | form state | |
| 6 | `src/app/launch/page.tsx` success overlay (line 48) | Dialog | `status === 'success'` from Zustand | Controlled `open` |
| 7 | `src/components/social/SocialLinkManager.tsx` | Dialog (side panel) | `isOpen`, `showAddForm` | Use `className="fixed inset-y-0 right-0 w-80"` on `DialogContent` |
| 8 | `src/components/bags/BagsTokensSection.tsx` | Dialog | `isOpen`, `isValidating`, `validationResult` | Keep async validation inside content; don't auto-close on success |
| 9 | `src/components/turnkey/ImportWalletModal.tsx` | Dialog | 3-step wizard + 1.5s success auto-close | `useEffect` on `step==='success'` → `onOpenChange(false)` after timeout; reset form on close |

### Reference migration: `PulseColumn.tsx` sort dropdown (lines 112-147)

**Before (abridged):**
```tsx
<button onClick={() => setDropdownOpen(o => !o)}>Sort</button>
<AnimatePresence>
  {dropdownOpen && (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
      <motion.div className="absolute z-50 ..."> {/* items */} </motion.div>
    </>
  )}
</AnimatePresence>
```

**After:**
```tsx
<Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
  <PopoverTrigger asChild>
    <button>Sort</button>
  </PopoverTrigger>
  <PopoverContent className="w-48 p-1">
    {/* items */}
  </PopoverContent>
</Popover>
```

Delete the overlay div, delete `AnimatePresence`. Radix handles click-outside, Esc, focus return, portal, z-index via `--z-popover`.

### Blocker gotchas
- **Framer + Radix**: wrap `PopoverContent` children in `motion.div` with `data-state` driven animations if you want the old feel.
- **ImportWalletModal**: do not destroy `step` state on close; reset it in a `useEffect` watching `open`.
- **SocialLinkManager** side-panel positioning: Radix's centered default is overridden via `className` on `DialogContent`. Combine with `sideOffset`-style custom layout.

---

## Phase 4 — Token codemod (safe, mechanical)

Run previews first, then apply. Commands assume zsh + ripgrep (`rg`).

```bash
cd /Users/senzenn/Projects/bags-jhatu/Bags-Terminal

# 0. Sanity: count occurrences
rg -c 'text-\[#666\]' src/
rg -c 'text-\[#555\]' src/
rg -c 'bg-\[#1A1A1A\]' src/

# 1. Orphan neutrals → semantic tokens (once Phase 0 adds them)
rg -l 'text-\[#666\]' src/ | xargs sed -i '' 's/text-\[#666\]/text-muted-high/g'
rg -l 'text-\[#555\]' src/ | xargs sed -i '' 's/text-\[#555\]/text-muted-mid/g'
rg -l 'bg-\[#1A1A1A\]' src/ | xargs sed -i '' 's/bg-\[#1A1A1A\]/bg-elevated/g'

# 2. Existing tokens used as arbitrary values (uppercase vs Tailwind naming)
#    Note: verify these match the class names Tailwind v4 generates from your @theme before running.
#    `--color-acid-green` → `text-acid-green` / `bg-acid-green`
rg -l 'text-\[#39FF14\]' src/ | xargs sed -i '' 's/text-\[#39FF14\]/text-acid-green/g'
rg -l 'bg-\[#39FF14\]'   src/ | xargs sed -i '' 's/bg-\[#39FF14\]/bg-acid-green/g'
rg -l 'text-\[#EDEDED\]' src/ | xargs sed -i '' 's/text-\[#EDEDED\]/text-primary/g'
rg -l 'text-\[#888\]'    src/ | xargs sed -i '' 's/text-\[#888\]/text-secondary/g'
rg -l 'text-\[#FF003C\]' src/ | xargs sed -i '' 's/text-\[#FF003C\]/text-signal-red/g'
rg -l 'text-\[#FFD700\]' src/ | xargs sed -i '' 's/text-\[#FFD700\]/text-gold/g'

# 3. Verify visually: run dev server, spot-check pages (pulse, terminal, launch, creator)
pnpm dev    # or npm run dev
```

### `src/app/pitch/page.tsx` inline `style={{ color: hex }}`
16 sites (lines 140, 373-374, 480-481, 518, 579, 584, 587, 639, 732, 754, 757, 785, 826). Replace with `className="text-[var(--color-...)]"` referencing tokens. This one is manual — each site has a different intended color.

### Z-index migration
Replace raw `z-[100]` (3 sites: `pitch/page.tsx:1436`, `early-access/layout.tsx:29`, `ui/Toast.tsx:90`) with `style={{ zIndex: "var(--z-modal)" }}` or `style={{ zIndex: "var(--z-toast)" }}`. Once Radix migration lands, most hand-rolled `z-40` / `z-50` are deleted automatically.

---

## Phase 5 — Motion & miscellaneous

### H-9 · Framer-motion in `src/app/pitch/page.tsx`
```tsx
import { useReducedMotion } from "framer-motion";

export default function PitchPage() {
  const reduced = useReducedMotion();
  const fadeUp = reduced
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
    : { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
  // ...rest unchanged
}
```

### M-4 · Button consolidation (deferred)
Create `src/components/ui/Button.tsx` with `size: "sm" | "md" | "lg"` and a `variant` prop. Then replace ad-hoc buttons incrementally. Not in the critical path — do after Radix migration so modal buttons land consistently.

### M-7 · Dead dep
```bash
npm uninstall @heroui/react
```
Confirm `rg "@heroui" src/` returns zero matches before running.

---

## Verification

Per phase, run this checklist:

1. **Build**: `npm run build` — no new type errors.
2. **Dev server**: `npm run dev` — visit `/`, `/terminal`, `/terminal/[any-id]`, `/pulse`, `/launch`, `/creator`, `/pitch`, `/early-access`.
3. **Keyboard**: Tab through TopBar, open a migrated modal — Esc should close, focus should return to trigger.
4. **Mobile viewport**: DevTools 375px — DataTable scrolls horizontally; token symbols truncate; address columns show `XXXX…XXXX`.
5. **Screen reader smoke test**: VoiceOver on TopBar → "Main navigation, nav"; on a live badge → "Token status: Live, status".
6. **Numeric stability**: open `/terminal/[tokenId]` during live price updates — prices must not horizontally jitter.
7. **Empty state**: a Pulse column with no data → icon visible, label readable.
8. **Reduced motion**: OS toggle on → `/pitch` animations flat; `.badge-live` static.
9. **Git check**: `git diff --stat main...docs/ui-audit` — only `src/**/*.tsx`, `src/app/globals.css`, and this repo's `ui-audit.md` / `ui-fix-plan.md` changed. No changes in `src/hooks`, `src/store`, `src/services`, `src/app/api`.

## Out of scope (will not be touched by this plan)

- `src/store/**` (Zustand stores)
- `src/hooks/**` (wallet/trade hooks)
- `src/services/**` (API clients)
- `src/app/api/**` (route handlers)
- `src/components/turnkey/TurnkeyProvider.tsx` logic (only layout wrapper in `layout.tsx` changes)
- Any wallet/signing flow, rate-limiting, JWT handling, RPC calls.
