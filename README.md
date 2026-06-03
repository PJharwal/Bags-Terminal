# BAGS Terminal

**Trade Solana at the source.** One Solana wallet, every market — spot memes, prediction markets, and perps from a single interface. No manual bridging. Built on [bags.fm](https://bags.fm).

BAGS Terminal is a chain-abstracted trading terminal on Solana. The model is simple: you keep one Solana wallet and one interface, while solver infrastructure routes execution across markets. Spot trading and token launches on bags.fm are **live today**; prediction markets and perps are **coming soon** (currently placeholder pages in testing). On-chain spot trade execution is wired but **deferred** — it activates only once a buy/sell backend is configured (see Environment Variables).

- Production: [www.bagsterminal.fm](https://www.bagsterminal.fm) (apex `bagsterminal.fm` 307-redirects to `www`)
- Repo: [PJharwal/Bags-Terminal](https://github.com/PJharwal/Bags-Terminal)

> Honesty note: this README documents what the product does **right now**. Features are tagged `Live`, `Coming soon`, or `Deferred`. The `/pitch` deck is an investor-facing narrative with forward-looking and aspirational claims (volume, traction, awards) — those are not current product capabilities and are not repeated here.

---

## Markets at a glance

| Market | Route | Status |
|--------|-------|--------|
| Spot / memecoins | `/pulse`, `/trending`, `/terminal/[tokenId]` | **Live** (market data + live feed). On-chain trade execution **deferred** — see below. |
| Token launches | `/launch` | **Live** (signed by your connected wallet) |
| Creator fee sharing & claims | `/creator` | **Live** (signed by your connected wallet) |
| Prediction markets | `/prediction` | **Coming soon** (placeholder, "In Testing") |
| Perps | `/perps` | **Coming soon** (placeholder, "In Testing") |

The header navigation exposes seven items: `HOME`, `PULSE`, `TRENDING`, `PERPS`, `PREDICTION`, `LAUNCH`, `CREATOR`. The per-token terminal index (`/terminal`), `/analyze`, and `/deployers` exist and are reachable by direct URL or in-app links, but are intentionally not linked in the header nav.

---

## Features

### Pulse — live token feed `Live`

`/pulse`

- Axiom-style three-column virtualized layout: **New Pairs**, **Final Stretch**, **Migrated**, rendered with `@tanstack/react-virtual`. Columns and filtered lists are memoized so the trade firehose doesn't churn the virtualizer.
- **Filter dropdown** (functional): market-cap tier (`All` / `High` ≥ $500K / `Mid` $100K–$500K / `Low` < $100K) plus a **Hide risky tokens** toggle (drops tokens with a critical risk flag). Active-filter count badge and reset.
- **Refresh**: clears and re-fetches the three columns from the backend (`/api/tokens` with `new`, `status=graduating&hours=6`, `status=migrated`). A separate silent 30s reconcile re-syncs Final Stretch + Migrated without skeletons.
- **Quick-buy button** (`0.1 SOL`): routes to `/terminal/{tokenId}?buy=0.1`, prefilling the terminal trade panel.
- **Logo backfill**: a `metadata_updated` socket event fills in logo / name / holders for tokens created before their off-chain metadata was indexed; cards retry a fresh logo when the URL changes.
- **Wrapped-SOL noise filtering**: incoming trade events on wSOL (the quote side, the majority of the firehose) are dropped before any store update.
- **Per-frame trade coalescing**: trades are queued and flushed at most once per animation frame; additive fields (volume, tx count) accumulate, and only changed columns get new array references.
- **Feed status** is derived honestly: `live` if a real socket event arrived in the last 30s, else `polling` if REST data is fresh, else `offline` — shown as a colored dot with the visible (post-filter) token count.

### Trending `Live`

`/trending`

- Reuses the Pulse store (live socket + DexScreener seed), sorted by market cap.
- Filters: state, market cap, with-fees; plus a **leaders** view ranked by lifetime fees on BAGS and a **bags** view. Grid and table layouts. Cards link to `/terminal/{tokenId}`.

### Terminal — per-token view `Live` (data) · `Deferred` (execution)

`/terminal/[tokenId]`

- **GeckoTerminal chart** embedded via iframe (pool resolved from DexScreener).
- **Live trades** table fed by the socket; empty state reads "No live trades — trade feed unavailable".
- Bottom tabs: **Holders**, **Top Traders**, **Fees**, **Dev Tokens**.
- Dynamic Open Graph / Twitter card per token (see Share cards).
- **Trade panel**: full buy/sell UI is present — Buy/Sell tabs, presets (`0.1 / 0.5 / 1 / 5` SOL), Zero-Config, slippage / priority / Jito controls, and the `?buy=<amount>` deep link from Pulse quick-buy.
- **On-chain trade execution is deferred.** The trade socket only connects when `NEXT_PUBLIC_BUYSELL_SERVER_URL` is set. With it empty (the default), the trade panel shows **"Trading not configured"** and the trade button is disabled. Configure the buy/sell backend to enable execution.

`/terminal` with no token id renders a token picker (trending + recent Pulse tokens + manual mint-address input). It does **not** redirect.

### Token launch `Live`

`/launch`

- No-code token creation through the official **Bags SDK / public API v3**: image → IPFS, create config, build the launch transaction. The launch transaction is signed by your **connected wallet** (`sendTransaction`) — independent of the buy/sell backend.
- **Fee sharing**: up to 100 claimers, configured at launch.
- **Referral attribution**: `?ref=` partner key, with a generated referral Open Graph card.
- On success, shows a shareable token card and an "Open in Terminal" link.

### Creator dashboard `Live`

`/creator`

- Loads your created tokens, claimable fees, claim history, and partner config (requires a connected wallet).
- **Fee claims** and **partner claims** build transactions via the Bags public API v3 (`/creator/claim`, `/partner/claim`, `claim-txs/v3`) and are signed by your connected wallet.

### Token analysis & deployer intel `Live` (unlinked)

- `/analyze` — deep token analysis: risk audit, holders table, top-traders table.
- `/deployers` — deployer intelligence aggregated from live token data: launch counts, success rate, risk flags.

Both work and are reachable by URL or in-app links; they are not in the header nav.

### Share & referral cards `Live`

`/api/og` (server-rendered with `next/og`)

- **Per-token card** (`?mint=`): fetches token data from DexScreener and renders a 1200×630 card with symbol, name, price, 24h change, MCAP / Vol / Liquidity; falls back to the default card if token data is unavailable. Terminal pages set their OG / Twitter images to this card.
- **Referral card** (`?ref=`): "REFERRED BY {short}… launch with built-in fee sharing", using the official Bags logo. `/launch?ref=` wires this into its metadata.
- **Default card** (no params): headline "One Terminal. Every Market." with sub-copy "Spot memes, prediction markets & perps on Solana — built on bags.fm." and a "LIVE · SOLANA MAINNET" tag.

### Prediction markets `Coming soon`

`/prediction` — placeholder page (`ComingSoonMarket`): tagline "Cross-Chain Prediction Markets", title "POLYMARKET, ZERO BRIDGING", status badge "In Testing", "Coming Soon" CTA, "Back to Pulse" link. No trading logic.

### Perps `Coming soon`

`/perps` — placeholder page (`ComingSoonMarket`): tagline "Cross-Chain Perps", title "PERPS WITHOUT LEAVING SOLANA", status badge "In Testing", "Coming Soon" CTA, "Back to Pulse" link. No trading logic.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.3 (App Router, Turbopack default) |
| Language | TypeScript 5 |
| UI runtime | React 19.2.3 / React DOM 19.2.3 |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| State | Zustand 5 (10 stores: pulse, socket, terminal, wallet, referral, creator, launch, omnera, selection, social) |
| Real-time | socket.io-client 4.8 |
| Virtualization | `@tanstack/react-virtual` 3 |
| Animation | Framer Motion 12 |
| Icons | `@remixicon/react`, `lucide-react` |
| Components | HeroUI, Radix UI (Dialog, Popover, Tooltip) |
| Fonts | `@fontsource` — Space Mono, Syncopate |
| Share cards | `next/og` (`ImageResponse`); `html-to-image` / `html2canvas` for in-app cards |
| Blockchain | `@solana/web3.js` 1.98, wallet-adapter (react / react-ui / wallets), `@solana/spl-token`; `bs58`, `bip39`, `ed25519-hd-key` |
| Embedded wallet | Turnkey (`@turnkey/sdk-server`, `@turnkey/crypto`) — server-side keys |
| Token launches | `@bagsfm/bags-sdk` 1.3.4 |
| Lint | ESLint 9 (`eslint-config-next` 16.1.3) |

No test framework is currently installed; there is no `test` or `typecheck` npm script.

---

## Data Sources

| Source | How it's used | Status |
|--------|---------------|--------|
| **DexScreener** | Primary market data: token detail, search, trending / boosted lists, and the per-token OG card. Called directly at `api.dexscreener.com` and also proxied at `/api/dexscreener`. | **Live** |
| **Bags API** | Token launches, fee sharing, creator / partner claims. Proxied server-side at `/api/bags` to `api.bags.fm` and `public-api-v2.bags.fm/api/v1`. Server-side API key, never exposed to the client. 60 req/min in-memory rate limit per IP. | **Live** |
| **solshift backend** | Pulse feed: REST `/api/tokens` (supports `status=graduating` / `migrated`, `limit`, `hours`) plus the socket.io firehose. Default `https://backend.solshift.fun`. | **Live** |
| **Solana RPC** | Wallet provider + wallet store. Public mainnet endpoint by default (`api.mainnet-beta.solana.com`). | **Live** |
| **Turnkey** | Embedded-wallet support; API keys are server-side only. Export route returns HTTP 503 when the buy/sell backend isn't configured. | **Live** (gated by buy/sell backend) |
| **GMGN** | Optional analytics. The `/api/gmgn` proxy first tries a local server (`GMGN_LOCAL_URL`, default `http://localhost:8000`, 1.5s timeout) then public `gmgn.ai` (3s timeout). | **Effectively dead** — public GMGN is Cloudflare-blocked, so without a local server it returns 502 and the app falls back to DexScreener. |
| **Buy/sell backend** | On-chain spot trade execution + Turnkey export. `NEXT_PUBLIC_BUYSELL_SERVER_URL`. | **Deferred** — empty by default; trade panel shows "Trading not configured" until set. |

### Socket.io rooms

The live feed connects to `config.baseServerUrl` over the websocket transport and subscribes to: `new_tokens:all`, `trades:all`, `migrations:all`, `metadata:all`.

---

## Getting Started

### Prerequisites
- Node.js 18+ (the repo declares no `engines` / `packageManager`; `@types/node` is v20)
- A package manager: `bun`, `npm`, or `pnpm`

### Install & run

```bash
git clone https://github.com/PJharwal/Bags-Terminal.git
cd Bags-Terminal

bun install        # or: npm install / pnpm install
bun dev            # or: npm run dev / pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

```bash
bun dev      # next dev (Turbopack)
bun build    # next build
bun start    # next start
bun lint     # eslint
```

(Use `npm run <script>` / `pnpm <script>` if you prefer.) There is no test or typecheck script defined.

---

## Environment Variables

Create `.env.local`. The app runs with sensible defaults for most public vars; some features stay disabled until their backend is configured.

### Public (client-exposed)

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_BASE_SERVER_URL` | `https://backend.solshift.fun` | solshift backend for the Pulse feed (REST + socket.io). |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | `https://api.mainnet-beta.solana.com` | Solana RPC for the wallet provider / wallet store. |
| `NEXT_PUBLIC_BUYSELL_SERVER_URL` | _(empty)_ | Buy/sell backend for on-chain trade execution + Turnkey export. **Empty = trading disabled** ("Trading not configured"). |
| `NEXT_PUBLIC_BASE_GMGN_URL` | _(empty)_ | GMGN proxy base. Empty logs a client-side config warning; GMGN is effectively dead, app falls back to DexScreener. |
| `NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID` | _(empty)_ | Turnkey organization id (public). |
| `NEXT_PUBLIC_TURNKEY_API_BASE_URL` | `https://api.turnkey.com` | Turnkey API base URL. |
| `NEXT_PUBLIC_SITE_URL` | `https://www.bagsterminal.fm` | Canonical site URL for metadata / absolute OG image URLs. |
| `NEXT_PUBLIC_BAGS_API_KEY` | _(optional)_ | Public Bags API key, if used client-side. |
| `NEXT_PUBLIC_SOLANA_NETWORK` | _(optional)_ | Solana network label (e.g. `mainnet-beta`). |

### Server-only (never sent to the client)

| Variable | Default | Purpose |
|----------|---------|---------|
| `BAGS_API_KEY_SERVER` | _(required for Bags features)_ | Bags API key injected by the `/api/bags` proxy. |
| `GMGN_LOCAL_URL` | `http://localhost:8000` | Local GMGN server tried first by the `/api/gmgn` proxy. |
| `TURNKEY_API_KEY` | _(empty)_ | Turnkey server API key. |
| `TURNKEY_API_SECRET` | _(empty)_ | Turnkey server API secret. |
| `TURNKEY_ORG_ID` | _(empty)_ | Turnkey server organization id. |
| `TURNKEY_API_BASE_URL` | `https://api.turnkey.com` | Turnkey server API base URL. |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                     # Home (hero + live tokens; connected: wallet stats, referral, quick actions)
│   ├── pulse/page.tsx               # Live token feed (Axiom 3-column virtualized)
│   ├── trending/page.tsx            # Trending + fee leaders
│   ├── terminal/page.tsx            # Token picker index (no redirect)
│   ├── terminal/[tokenId]/page.tsx  # Per-token terminal (chart, trades, trade panel)
│   ├── launch/page.tsx              # Token launch (live, wallet-signed)
│   ├── creator/page.tsx             # Creator dashboard (fees, claims, partner)
│   ├── analyze/page.tsx             # Token analysis (unlinked)
│   ├── deployers/page.tsx           # Deployer intelligence (unlinked)
│   ├── perps/page.tsx               # Coming soon (ComingSoonMarket)
│   ├── prediction/page.tsx          # Coming soon (ComingSoonMarket)
│   ├── pitch/page.tsx               # Standalone investor deck (direct URL only)
│   ├── layout.tsx                   # Global metadata + providers
│   └── api/
│       ├── og/route.tsx             # Open Graph / share / referral cards
│       ├── bags/[...path]/          # Bags proxy (server key, 60 req/min)
│       ├── dexscreener/[...path]/   # DexScreener proxy
│       ├── gmgn/[...path]/          # GMGN proxy (local → public fallback)
│       └── turnkey/                 # Turnkey routes (export gated on buy/sell backend)
├── components/
│   ├── TopBar.tsx                   # Header nav (7 links) + search + UTC clock + wallet
│   ├── ComingSoonMarket.tsx         # Placeholder used by /perps and /prediction
│   ├── pulse/                       # Axiom feed (columns, cards, toolbar)
│   ├── terminal/                    # Chart, trade panel, bottom tabs
│   └── ...
├── store/                           # Zustand stores (10)
├── services/                        # bags / dexscreener / gmgn / token services
├── hooks/                           # useTradeSocket, useWallet, etc.
├── lib/                             # turnkey, types, formatting, utils
└── config/env.ts                    # Data-source + env configuration
```

---

## Security

- Bags API key is server-side only (`BAGS_API_KEY_SERVER`), injected by the `/api/bags` proxy and never exposed to the client. Turnkey API secrets are server-side only.
- `/api/bags` proxy applies a 60 req/min in-memory rate limit per IP, with periodic cleanup.
- Global security headers (set in `next.config.ts`): `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a `Permissions-Policy` disabling camera / microphone / geolocation.
- Wallet integration uses the official Solana wallet-adapter.

---

## License

MIT
