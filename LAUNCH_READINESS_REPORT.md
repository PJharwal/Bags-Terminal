# BAGS Terminal - Launch Readiness Report

**Date:** 2026-03-27
**Reviewed by:** Senior UI Dev, Senior Architect, Product Manager perspectives
**Build status:** Passes (TypeScript clean, ESLint clean on src/, production build succeeds)
**Branch:** test

---

## Executive Summary

The BAGS Terminal is a well-structured Next.js 16 / React 19 Solana token monitoring platform with real-time WebSocket data, token launch, fee claims, and analysis features. The codebase compiles clean and the architecture is solid.

However, **14 CRITICAL/HIGH issues** and **13 MEDIUM/LOW issues** were found that must be addressed before a public launch. The most severe involve **silent financial data fabrication**, **API key exposure in the browser bundle**, **orphaned WebSocket connections causing duplicate events**, and **permanently locked UI states on network errors**.

---

## CRITICAL (Must Fix Before Launch)

### C1. Fabricated credibility scores served as real financial data
- **File:** `src/lib/credibility.ts:304-330`
- **Impact:** When real data is unavailable (API failure, race condition), the function generates hash-based pseudo-random scores and returns them in the exact same shape as real data. No flag distinguishes synthetic from real. Users make trading decisions on fabricated risk scores.
- **Fix:** Add `dataSource: 'real' | 'synthetic'` to the return type. When synthetic, render "Data unavailable" in the UI instead of fake scores. Or remove the fallback entirely.

### C2. BAGS API key exposed in browser bundle
- **File:** `src/app/api/bags/[...path]/route.ts:5`
- **Impact:** `NEXT_PUBLIC_BAGS_API_KEY` is used as a fallback for the server-side key. `NEXT_PUBLIC_*` vars are inlined into client JavaScript at build time. Anyone can extract the key from `_next/static/chunks/*.js` and make direct API calls (token launches, swaps, fee claims) bypassing rate limits.
- **Fix:** Remove `process.env.NEXT_PUBLIC_BAGS_API_KEY` from the server route fallback. Return 503 if `BAGS_API_KEY_SERVER` is missing. Audit and remove all client-side references to the API key.

### C3. Orphaned WebSocket socket on double connect()
- **File:** `src/store/socket.store.ts:39-144`
- **Impact:** Guard checks `socket?.connected` -- if `connect()` is called twice before connection establishes (React Strict Mode, two components mounting), the guard fails and a second socket is created. The first socket is never disconnected. Both fire `new_token`, `trade`, `migration` events into the same store. Every real-time event is processed twice -- duplicate tokens, double trade counts.
- **Fix:** Change guard to `if (socket) return` or add a `connecting` flag. Disconnect existing socket before creating a new one.

### C4. `useMemo` misused as `useCallback` -- "With Fees" filter permanently broken
- **File:** `src/app/trending/page.tsx:386-396`
- **Impact:** `handleFeeDataLoaded` wrapped in `useMemo` instead of `useCallback`. `useMemo` executes the function and returns its result (undefined). The `onFeeDataLoaded` prop is always undefined. `tokensWithFees` stays empty. The "With Fees" filter tab always shows zero tokens.
- **Fix:** Replace `useMemo` with `useCallback`.

### C5. `validateAndAdd` permanently locks Add Token button on network error
- **File:** `src/components/bags/BagsTokensSection.tsx:302-329`
- **Impact:** No try/catch or finally block. If `validateBagsToken` throws (network error), `setIsValidating(false)` is never reached. Button stays disabled with spinner forever. User must reload the page.
- **Fix:** Wrap in try/catch/finally. Move `setIsValidating(false)` to finally block.

### C6. Empty catch in `handleLaunch` can leave launch status permanently stuck
- **File:** `src/components/launch/TransactionSummary.tsx:55-57`
- **Impact:** `catch {}` silently swallows all errors. If `executeLaunch` rejects after status becomes `'confirming'` (wallet disconnect mid-tx), status stays stuck. Launch button permanently disabled. User cannot retry without page refresh -- during time-sensitive token launches.
- **Fix:** In catch block, call `resetStatus()` and show `toast.error`. Don't rely solely on store error handling.

### C7. Silent partial failure in fee claim -- risk of double-claim
- **File:** `src/components/creator/FeeClaimsTab.tsx:26-36`
- **Impact:** `handleClaimAll` iterates fees serially, breaks on first failure. If claim 1 of N succeeds on-chain and claim 2 fails, user sees only `console.error`. No toast, no UI update. User may retry all claims, submitting duplicate on-chain transactions.
- **Fix:** Replace `break` with `continue`. Show `toast.error` per failure. Surface partial success summary.

### C8. Localhost fallback URLs shipped to production
- **File:** `src/config/env.ts:9, 17`
- **Impact:** `baseGmgnUrl` defaults to `http://localhost:8000`, `buysellServerUrl` defaults to `http://localhost:3000`. If env vars are missing in deployment, all GMGN features (analyze, holders, traders) and buy/sell flows silently fail with CORS/network errors. No error message indicates misconfiguration.
- **Fix:** Remove localhost defaults. Add runtime validation that throws if required URLs are missing in production.

---

## HIGH (Should Fix Before Launch)

### H1. No error boundaries anywhere in the app
- **File:** `src/app/` (entire directory)
- **Impact:** No `error.tsx` at root or route level. An uncaught render error in any component (malformed API response, undefined token data) crashes the entire page with Next.js generic error. No recovery path.
- **Fix:** Add `src/app/error.tsx` with recovery UI. Add route-specific `error.tsx` under `terminal/[tokenId]/`.

### H2. `document.querySelector('input')` selects wrong element
- **File:** `src/app/terminal/page.tsx:168`
- **Impact:** Grabs the first `<input>` in the entire DOM, not the address input. If TopBar renders an input first, terminal opens with wrong/empty value.
- **Fix:** Use `useRef` on the input element.

### H3. Race condition on BAGS filter toggle
- **File:** `src/app/pulse/page.tsx:369-378`
- **Impact:** `setTimeout(handleRefresh, 100)` on each filter click. Rapid clicks enqueue multiple refreshes -- each clears the store and fires concurrent fetches. Non-deterministic token list after rapid toggling.
- **Fix:** Use debounce with abort controller. Discard results from superseded fetches.

### H4. Security headers entirely missing
- **File:** `next.config.ts`
- **Impact:** No CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy. This is a trading terminal that triggers wallet signing. XSS via unsanitized token names could inject scripts into wallet approval flows.
- **Fix:** Add `headers()` to next.config.ts with CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin.

### H5. Rate limiter bypassable via spoofed X-Forwarded-For
- **File:** `src/app/api/bags/[...path]/route.ts:65-67`
- **Impact:** Client-controlled header used as rate limit key. Attackers rotate the header to bypass 60 req/min limit.
- **Fix:** Use platform-injected IP header (Vercel/Cloudflare). Or require auth token.

### H6. No rate limiting on /api/gmgn and /api/dexscreener
- **File:** `src/app/api/gmgn/[...path]/route.ts`, `src/app/api/dexscreener/[...path]/route.ts`
- **Impact:** Unlimited requests. Attacker floods GMGN proxy, gets the server IP banned by GMGN. All users lose GMGN data.
- **Fix:** Apply same rate limiting pattern used in Bags proxy.

### H7. `refreshAll` silently swallows sub-loader errors
- **File:** `src/store/creator.store.ts:85-100`
- **Impact:** Each sub-loader catches its own errors. `refreshAll`'s outer catch never fires. `error` state stays null on failure. UI shows stale data.
- **Fix:** Have sub-loaders propagate errors. Set per-loader or aggregate error state.

### H8. `loadInitialData` race condition allows duplicate population
- **File:** `src/store/pulse.store.ts:322-353`
- **Impact:** Two concurrent callers both see `totalItems === 0`, both fetch and populate. `addItem` doesn't deduplicate by tokenId. Same token appears twice in lists.
- **Fix:** Check `isInitialLoading` in the guard: `if (get().isInitialLoading || totalItems > 0) return`.

### H9. Deployer address copy button is non-functional
- **File:** `src/components/pulse/PulseDrawer.tsx:143-144`
- **Impact:** Copy icon rendered with `cursor-pointer` but no `onClick` handler. Clicking does nothing. On a financial terminal, inability to copy deployer address for verification is a trust issue.
- **Fix:** Add `onClick` with `navigator.clipboard.writeText(item.deployer)`.

### H10. `copyAddress` reports success before clipboard write resolves
- **File:** `src/components/bags/BagsTokensSection.tsx:55-58` (also `FeeEarnersPanel.tsx:45-48`, `PartnerConfigTab.tsx:56-61`)
- **Impact:** `setCopied(true)` called synchronously before the clipboard promise resolves. If write fails (non-HTTPS, no permission), user sees checkmark but clipboard is empty. In crypto context, pasting wrong address = lost funds.
- **Fix:** Await the promise: `.then(() => setCopied(true)).catch(() => toast.error('Copy failed'))`.

### H11. `wallet.store.ts` addTransaction writes duplicate to localStorage
- **File:** `src/store/wallet.store.ts:60-68`
- **Impact:** `set()` adds tx to state, then `localStorage.setItem` does `[tx, ...get().transactions]` -- tx is included twice. On next page load, most recent transaction appears duplicated.
- **Fix:** Compute the array once before `set()` and `localStorage.setItem()`.

### H12. `window.location.href` instead of router.push on launch success
- **File:** `src/app/launch/page.tsx:57`
- **Impact:** Full browser reload after token launch. Loses all Zustand state (socket connection, wallet state). Cold-start reconnect.
- **Fix:** Use `router.push('/terminal/${result.tokenMint}')`.

---

## MEDIUM (Should Fix Soon After Launch)

### M1. SOL_PRICE = 140 hardcoded in 3+ files
- **Files:** `src/app/pulse/page.tsx:19`, `src/app/terminal/[tokenId]/page.tsx:47,55`, `src/app/trending/page.tsx:475`
- **Fix:** Define once in `src/lib/constants.ts` and import everywhere.

### M2. Fee data fetching logic duplicated between BagsTokenCard and TokenTableRow
- **File:** `src/app/trending/page.tsx:42-73, 232-261`
- **Fix:** Extract `useFeeData(tokenId, onFeeDataLoaded)` custom hook.

### M3. console.log statements in production socket/pulse code
- **Files:** `src/store/socket.store.ts` (8 instances), `src/app/pulse/page.tsx` (5 instances)
- **Fix:** Remove or gate behind `process.env.NODE_ENV === 'development'`.

### M4. `transitionItem` directly mutates PulseItem object
- **File:** `src/store/pulse.store.ts:241-263`
- **Fix:** Create new object with spread: `{ ...itemToMove, state: newState }`.

### M5. Dual canvas-to-image libraries
- **File:** `package.json`
- **Impact:** Both `html-to-image` and `html2canvas` (unmaintained since 2021). ~300KB extra bundle.
- **Fix:** Consolidate on `html-to-image`, remove `html2canvas`.

### M6. Missing `prefers-reduced-motion` guard on all animations
- **File:** `src/app/globals.css`
- **Fix:** Add `@media (prefers-reduced-motion: reduce)` block that kills all animation durations.

### M7. Geist fonts loaded but never used in CSS
- **File:** `src/app/layout.tsx:9-16`
- **Impact:** Two unnecessary font requests. App uses Space Mono / Syncopate / Inter.
- **Fix:** Remove Geist imports from layout.tsx.

---

## LOW (Nice to Have)

### L1. Token images use `<img>` instead of Next.js `<Image>`
- Multiple files. Missing width/height/loading attributes.

### L2. Missing aria-labels on icon-only buttons
- Refresh, back, close buttons across pulse, terminal, deployers pages.

### L3. External `<img>` tags lack onError fallback
- `FeeEarnersPanel.tsx`, `FeeClaimsTab.tsx`, `PartnerConfigTab.tsx`. Broken image icons on 404.

### L4. Toast ID collision under rapid-fire emission
- `src/components/ui/Toast.tsx:24`. `Date.now()` can collide. Use `crypto.randomUUID()`.

### L5. `.input` class removes focus outline without guaranteed replacement
- `src/app/globals.css:148`. Focus ring requires separate `.focus-ring` class to be co-applied.

### L6. `formatNumber` doesn't guard NaN/Infinity
- `src/lib/format.ts:3-14`. Returns "NaN" or "Infinityb" strings.

---

## Pre-Launch Checklist

| # | Task | Priority | Est. Effort |
|---|------|----------|-------------|
| 1 | Fix API key exposure (C2) | CRITICAL | 30 min |
| 2 | Fix socket double-instantiation (C3) | CRITICAL | 30 min |
| 3 | Fix useMemo -> useCallback (C4) | CRITICAL | 5 min |
| 4 | Fix validateAndAdd try/catch (C5) | CRITICAL | 10 min |
| 5 | Fix handleLaunch empty catch (C6) | CRITICAL | 15 min |
| 6 | Fix fee claim partial failure (C7) | CRITICAL | 30 min |
| 7 | Fix localhost fallback URLs (C8) | CRITICAL | 15 min |
| 8 | Remove/flag credibility fallback (C1) | CRITICAL | 45 min |
| 9 | Add error.tsx boundaries (H1) | HIGH | 30 min |
| 10 | Add security headers (H4) | HIGH | 20 min |
| 11 | Fix copy button handlers (H9, H10) | HIGH | 20 min |
| 12 | Add rate limiting to gmgn/dexscreener (H6) | HIGH | 20 min |
| 13 | Fix document.querySelector (H2) | HIGH | 10 min |
| 14 | Fix pulse filter race condition (H3) | HIGH | 20 min |
| 15 | Fix rate limiter IP spoofing (H5) | HIGH | 15 min |
| 16 | Fix refreshAll error swallowing (H7) | HIGH | 15 min |
| 17 | Fix loadInitialData race (H8) | HIGH | 10 min |
| 18 | Fix localStorage duplicate (H11) | HIGH | 10 min |
| 19 | Fix window.location.href (H12) | HIGH | 5 min |
| 20 | Remove console.logs (M3) | MEDIUM | 15 min |
| 21 | Centralize SOL_PRICE (M1) | MEDIUM | 10 min |
| 22 | Remove unused Geist fonts (M7) | MEDIUM | 5 min |

**Estimated total for CRITICAL + HIGH:** ~6 hours of focused work

---

## What's Working Well

- **Build is clean** -- TypeScript compiles with zero errors, production build succeeds
- **Architecture is solid** -- clean separation of concerns (stores, services, hooks, components)
- **Real-time system** -- Socket.IO integration with proper room subscriptions
- **Type system** -- comprehensive TypeScript types across the codebase
- **API proxy pattern** -- server-side key protection with fallback chains
- **Modular skills architecture** -- extensible analysis engine design
- **Zustand stores** -- lightweight, well-scoped state management
- **Design system** -- consistent brutalist/terminal aesthetic with CSS variables
- **Feature completeness** -- Pulse, Terminal, Trending, Analyze, Creator, Launch all functional
