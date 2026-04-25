# Bags-Terminal — UI Design Audit

Scope: UI only — layout, a11y, interaction, typography, motion, tokens. Backend, state management, wallet/custody, and security findings are tracked separately and excluded here by intent.

Severity: **Critical** (user-facing break now) · **High** (latent, fires on common condition) · **Medium** (design debt) · **Low** (cosmetic).

---

## Root causes (fix these three and most leaves collapse)

### RC-1 — Radix installed but unused; every modal/popover is hand-rolled
`@radix-ui/react-dialog`, `@radix-ui/react-popover`, `@radix-ui/react-tooltip` are already in `package.json`. Zero imports in `src/`. Result: 8 hand-rolled modal components, none with focus trap or scroll lock, 7/8 without Escape handling, 0/8 with `role="dialog"` or `aria-modal`. Adopt Radix instead of building a custom `DialogShell`.

### RC-2 — Design tokens defined but not used at call sites
17 color tokens live in `@theme` (`globals.css`), yet the codebase contains **1,324 arbitrary `[#...]` Tailwind values**. Top offenders:
- `text-[#39FF14]` (245x) — is `--color-acid-green`
- `text-[#EDEDED]` (202x) — is `--color-text-primary`
- `text-[#888]` (157x) — is `--color-text-secondary`
- `text-[#666]` (281x) — **not in tokens** (orphan neutral)
- `bg-[#1A1A1A]` (46x) — **not in tokens** (orphan neutral)
- `text-[#555]` (41x) — **not in tokens** (orphan neutral)

Add the three orphan neutrals to `@theme`, then migrate call sites (mechanical find/replace).

### RC-3 — Zero `aria-*` attributes across the entire codebase
All seven aria attribute types (label, labelledby, describedby, live, hidden, expanded, controls) occur 0 times in `src/`. Only 1/20 `<label>` tags use `htmlFor`. Screen readers get nothing. This is the single largest accessibility gap.

---

## Critical — users hit these on normal use

### C-1 · Long wallet addresses rendered untruncated in table rows
`src/components/tables/DataTable.tsx:59` — `{token.deployer_wallet}` printed raw.
**Why broken:** overflows narrow columns; full 44-char base58 addresses break row layout.
**Fix:** use existing `formatWallet()` from `src/lib/format.ts` (already handles middle-truncation).

### C-2 · Token symbol overflows in TerminalHeader
`src/app/terminal/components/TerminalHeader.tsx:84` — `<span className="text-sm font-bold">{token.symbol}</span>` with no `max-w` or `truncate`.
**Why broken:** long tickers push sibling content out of the header.
**Fix:** `truncate max-w-[120px]` + `title={token.symbol}`. Note: `PulseCardCompact.tsx:85` already does this correctly with `max-w-[90px] truncate` — use it as reference.

### C-3 · DataTable has no horizontal scroll below mobile breakpoints
`src/components/tables/DataTable.tsx:16-20` — the outer `<div className="flex-1 overflow-auto">` scrolls vertically but the 8-column table itself has no `min-w` floor, so columns collapse on narrow viewports.
**Fix:** `<table className="min-w-[960px]">` inside an `overflow-x-auto` wrapper; or a card-layout fallback under `md`.

### C-4 · Numeric cells jitter width as values update
`src/components/tables/DataTable.tsx:98-109` (volume, market cap) — `font-mono` only, no `tabular-nums`.
`src/app/terminal/components/TerminalHeader.tsx:114-119` (prices, % change) — same issue.
**Fix:** `font-variant-numeric: tabular-nums` on every numeric cell; add a `.num` utility class in `globals.css`.

### C-5 · Empty-state icon effectively invisible
`src/app/pulse/page.tsx:536` — icon uses `text-[#222]` on `--color-bg-primary` (#050505) → contrast ratio ~1.5:1, below the 3:1 minimum for non-text UI.
**Fix:** raise to `text-white/30` (or a new `--color-text-disabled` token) and include a visible text label.

---

## High — latent, fires under common conditions

### H-1 · Hand-rolled dropdowns miss focus trap, Esc, aria
- `src/components/turnkey/TurnkeyWalletButton.tsx:135-217` — dropdown, no focus management, no Esc handler.
- `src/components/pulse/PulseColumn.tsx:112-147` — sort dropdown, same issues, uses `AnimatePresence` but no keyboard handling.
- `src/components/launch/LaunchTokenForm.tsx` modal flow, `ImportWalletModal.tsx`, `BagsTokensSection.tsx`, `SlippageSettings.tsx`, `AddSocialLink.tsx`, `AddClaimerForm.tsx`, `SocialLinkManager.tsx` — all hand-rolled.
**Fix:** port each to `@radix-ui/react-dialog` or `@radix-ui/react-popover`. Radix handles focus trap, Esc, scroll lock, aria, portaling for free.

### H-2 · Zero aria attributes — screen readers get nothing
- `src/components/TopBar.tsx:42-66` — nav has no `aria-label`.
- `src/components/ui/StatusBadge.tsx:25-34` — badges have no `aria-label` or `role="status"` (critical on live badges that change asynchronously).
- Every icon-only button in the app.
**Fix:** `aria-label` on icon-only controls; `role="status" aria-live="polite"` on live-updating badges; `aria-label` on nav.

### H-3 · Color-only live / rugged signal
- `src/components/tables/DataTable.tsx:89` — `text-[#39FF14] animate-pulse` conveys "live" purely by color + motion.
- `src/components/pulse/PulseColumn.tsx:518` — same pattern.
**Fix:** pair every color signal with a glyph (`●` / `◯`) and a screen-reader-only text token.

### H-4 · Toast close hit area too small
`src/components/ui/Toast.tsx:75` — icon 12px, close button 10px. WCAG 2.5.5 requires 24×24 minimum; 44×44 preferred for mobile.
**Fix:** 24px hit area around the visual 10px icon via padding.

### H-5 · Hand-rolled modals don't lock body scroll
No call to `document.body.style.overflow` anywhere in `src/`. Example: `src/app/launch/page.tsx:48` modal backdrop is `bg-black/80` but background still scrolls.
**Fix:** migrating to Radix Dialog solves this (it scroll-locks automatically). Until then, a `useScrollLock` hook.

### H-6 · Form labels not associated with inputs
Only 1 of 20 `<label>` tags uses `htmlFor`. Example: `src/components/terminal/SlippageSettings.tsx:72` — input has no `id`/label pair, no `aria-label`.
Similar: `src/components/creator/TokenAdminTab.tsx`, `src/components/launch/LaunchTokenForm.tsx`, `src/components/bags/BagsTokensSection.tsx`.
**Fix:** wrap input in `<label>` or add `htmlFor`/`id` + shared `aria-label` when visual label isn't present.

### H-7 · Numeric inputs accept pasted non-numerics on mobile
`src/app/terminal/components/TerminalTradePanel.tsx:309, 327` and `src/components/terminal/SlippageSettings.tsx:72` — `type="number"` only; no `inputmode="decimal"`, no `pattern`.
**Fix:** `inputmode="decimal" pattern="[0-9.]*"` plus a controlled filter on change.

### H-8 · `ErrorBoundary.tsx` exists but is never imported
`src/components/ui/ErrorBoundary.tsx` defined; zero imports across `src/`.
**Fix:** wrap `TurnkeyProvider` + `WalletProviderWrapper` in `src/app/layout.tsx` with the existing boundary. `app/error.tsx` catches route errors but not provider-mount crashes.

### H-9 · Framer-motion in pitch page doesn't respect reduced motion
`src/app/pitch/page.tsx` — `fadeUp` and `stagger` variants use hardcoded durations. The global CSS reduced-motion rule can't reach motion-component timelines. Other pages are fine because they use CSS animations only.
**Fix:** `const prefersReducedMotion = useReducedMotion()` (framer-motion hook) and gate durations; or replace with `<motion.div initial={prefersReducedMotion ? false : "hidden"}>`.

### H-10 · Share card generation is screen-reader inaccessible
`src/components/share/useShareCard.ts` rasterizes HTML → PNG via `html-to-image`. Generated PNG has no alt text, no text alternative in the download flow.
**Fix:** when downloading, pair the PNG with an accessible text summary (`aria-describedby` on the trigger, or a hidden `<p>` read by SR).

### H-11 · `.badge-live` pulses on every badge that gets the class — regardless of live state
`src/app/globals.css:481-487` — `.badge-live` is `animation: badge-pulse 2s ease-in-out infinite;`. Applied in `src/components/pulse/PulseColumn.tsx:87` indiscriminately.
**Fix:** split into `.badge` (base) + `.badge--live` (motion modifier), apply only when truly live.

---

## Medium — design debt, degrades consistency

### M-1 · 1,324 arbitrary `[#hex]` values; 3 orphan neutrals not in token set
Data from grep:
- Tokenized but not used as tokens: `text-[#39FF14]` 245x, `text-[#EDEDED]` 202x, `text-[#888]` 157x — should be class names derived from `@theme`.
- Orphans (not in any token): `text-[#666]` 281x, `bg-[#1A1A1A]` 46x, `text-[#555]` 41x — define tokens for these first, then migrate.
**Fix path:** (1) add `--color-text-muted-high: #666`, `--color-text-muted-low: #555`, `--color-bg-elevated: #1A1A1A` to `@theme`; (2) codemod replace `text-[#666]` → `text-muted-high`, etc.

### M-2 · 16 inline `style={{ color: hex }}` on `/pitch`
`src/app/pitch/page.tsx` at lines 140, 373-374, 480-481, 518, 579, 584, 587, 639, 732, 754, 757, 785, 826.
**Fix:** CSS variables; delete inline hex.

### M-3 · Ad-hoc z-index values, no stacking scale
`src/components/pulse/PulseColumn.tsx:114` (z-40), `src/components/turnkey/TurnkeyWalletButton.tsx:138,141` (z-40/z-50), `src/components/tables/DataTable.tsx:21` (z-20).
**Fix:** z-scale tokens in `@theme` — `--z-popover: 40`, `--z-modal: 50`, `--z-toast: 60`, `--z-sticky: 20`. Bonus: Radix handles z-index via portal ordering, removing most of these.

### M-4 · Button heights inconsistent across forms
`src/components/terminal/SlippageSettings.tsx:57,87` (py-1.5), `src/app/terminal/components/TerminalTradePanel.tsx:301-306` (py-2), `src/app/globals.css:174` `.btn-primary` (no explicit height).
**Fix:** three button size tokens (sm/md/lg); one `<Button>` component; `.btn-primary` gets an explicit `min-h`.

### M-5 · Focus-visible ring defined but rarely applied
`src/app/globals.css:466-469` defines `.focus-ring:focus-visible`. Most buttons use `focus:outline-none` with no replacement.
**Fix:** apply `.focus-ring` via base Button; remove per-site `outline-none`.

### M-6 · Tooltips unavailable
`@radix-ui/react-tooltip` installed, zero imports. Truncated addresses / symbols have no way to reveal the full value on hover or focus.
**Fix:** use Radix Tooltip wherever `C-1`/`C-2` truncates something.

### M-7 · `@heroui/react` installed but unused
Ships bytes to the client via Next.js bundler if imported anywhere; currently zero imports so it may be dead in final bundle, but the dep adds install weight.
**Fix:** remove from `package.json` unless a team member confirms intended use.

---

## Low — cosmetic

### L-1 · Network status bars lack `role="status"`
`src/components/TopBar.tsx:74-80` — purely visual bars next to the `MAINNET_ONLINE` label. Text is there, so SR users aren't blocked.
**Fix:** wrap bars + text in `role="status" aria-live="polite"`.

### L-2 · 20-field launch form provides no skeleton during initial data load
`src/components/launch/LaunchTokenForm.tsx`, `src/components/launch/TokenPreviewCard.tsx`. Low impact because form fields are their own affordance.
**Fix:** only add a skeleton where first paint > ~300ms.

---

## Claims from earlier audit drafts that were INVALIDATED on verification

These were in prior iterations of this audit and are removed because the code already handles them:

- `DataTable.tsx:21` sticky header missing z-index → **has `z-20`**.
- `TerminalHeader.tsx:155-157` username not truncated → **has `.slice(0, 12)`** (not CSS truncation, but functional).
- `TerminalTradePanel.tsx:425` disabled button missing cursor-not-allowed → **has `disabled:cursor-not-allowed` class**.
- `TerminalTradePanel.tsx:427` `animate-spin` ignores reduced motion → **`globals.css:681-690` has global `prefers-reduced-motion` rule covering all animations** (except framer-motion, kept under H-9).
- `globals.css:207-211` `.btn-primary:disabled` missing cursor-not-allowed → **line 209 has `cursor: not-allowed`**.
- `PulseCardCompact.tsx` symbol not truncated → **line 85 has `max-w-[90px] truncate`** (kept as the positive reference in C-2).
- `LaunchTokenForm.tsx:190` / `TokenPreviewCard.tsx:23` missing `alt` → **have `alt="Token"`**.
- Image alt coverage overall: 21/22 meaningful — not a critical issue.

---

## Fix order (dependency-aware)

1. **Migrate to Radix** (`RC-1`). Removes `H-1`, `H-5`, much of `M-3` in one sweep.
2. **Fix critical user-visible breaks** (`C-1`..`C-5`). Mechanical — reuses existing `formatWallet`.
3. **a11y pass** (`RC-3`, `H-2`, `H-3`, `H-4`, `H-6`, `H-10`, `L-1`). Mostly adding aria attrs.
4. **Token rationalization** (`RC-2`, `M-1`, `M-2`, `M-3`). Codemod-friendly once tokens are added.
5. **Remaining polish** (`H-7`, `H-8`, `H-9`, `H-11`, `M-4`..`M-7`, `L-2`).

## Existing utilities to reuse (don't reinvent)

- `src/lib/format.ts` — `formatWallet`, `formatNumber`, `formatCurrency`, `formatPercent`, `formatTimeAgo`, status/score color mappers.
- `src/lib/utils.ts` — `cn`.
- `src/components/ui/ErrorBoundary.tsx` — existing class component, just needs wiring.
- `src/app/globals.css` — 17 color tokens, `.focus-ring`, `.btn-primary`, `.badge`, `.card`, progress bar utilities.
- Radix packages already in `package.json` — dialog, popover, tooltip.

## Out of scope (tracked in separate audits)

Backend, wallet custody, signing flows, state management, race conditions, and security findings. This document is UI-only by intent.
