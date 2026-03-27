# BAGS Terminal

Real-time Solana token monitoring, trading intelligence, and creator monetization platform built on [bags.fm](https://bags.fm). Streams live token launches, trades, and migrations via WebSocket, with integrated fee-sharing, token launch, and Dexscreener listing flows.

## Features

### Pulse Monitor (`/pulse`)
- Real-time token feed via WebSocket (Socket.IO) from `backend.solshift.fun`
- 3-column Kanban: NEW > FINAL_STRETCH > MIGRATED
- BAGS token filter (tokens with CA ending in `bags`)
- BAGS Launch Feed tab with auto-refresh (30s) from `bags.fm /token-launch/feed`
- Live connection status with auto-reconnect (5 attempts)
- Compact token cards with market cap, bonding %, holder count

### Terminal (`/terminal`, `/terminal/[tokenId]`)
- Token analysis dashboard: price, market cap, volume, holders, traders
- GeckoTerminal chart integration (iframe embed)
- Trade panel with market swap execution via bags.fm Trade API
- Fee earners panel with lifetime fees and claimed amounts (v3 claim stats)
- Credibility matrix with deployer/funding/distribution scoring
- Solscan link integration for on-chain verification
- Real-time trade stream via socket events

### Trending (`/trending`)
- Trending tokens from GMGN (primary) with DexScreener fallback
- BAGS Fee Leaders section: top tokens ranked by lifetime fees earned
- Jupiter token data: organic scores, audit info, holder counts
- Grid and table view toggles
- Filter by state, BAGS-only, and fee-sharing tokens

### Token Launch (`/launch`)
- Full token creation flow: image upload, metadata, fee config
- Fee share configurator: up to 100 claimers (wallet or social)
- Social provider support: Twitter, Kick, GitHub, TikTok
- Lookup table auto-creation for configs with 15+ claimers
- Partner key and tip configuration
- Transaction preview with real-time cost estimation

### Creator Dashboard (`/creator`)
- My Tokens: view all created tokens with stats
- Fee Claims: claim accumulated fees using v3 auto-claim endpoint
- Claim History: historical claim events with time-based filtering
- Partner Config: create/manage partner keys, view partner stats
- Token Admin: view admin tokens, transfer admin authority
- Dexscreener Listing: pay for enhanced token info listing directly

### Analyze (`/analyze`)
- Token audit engine with risk scoring (0-100)
- Sniper, bundler, fresh wallet, dev cluster detection
- Top holders and traders tables
- Wallet classification (deployer, insider, organic, whale)

### Deployers (`/deployers`)
- Deployer intelligence aggregated from live token data
- Deployer dossier: deployment history, success rate, token links
- Click-through to terminal for any deployed token

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.3 (App Router, Turbopack) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19.2.3 |
| Styling | Tailwind CSS 4 (PostCSS) |
| State | Zustand 5 (9 stores) |
| Real-time | Socket.IO Client 4.8 |
| Blockchain | @solana/web3.js 1.98, wallet-adapter |
| Bags SDK | @bagsfm/bags-sdk 1.3.4 |
| Animation | Framer Motion 12 |
| Icons | Lucide React |
| Virtualization | TanStack React Virtual |
| Components | HeroUI, Radix UI (Dialog, Popover, Tooltip) |
| Fonts | Space Mono, Syncopate |

## Getting Started

### Prerequisites
- Node.js 18+ (recommended: 23.x via nvm)
- bun, npm, or pnpm

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Required
BAGS_API_KEY_SERVER=your_bags_api_key        # Server-side bags.fm API key
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_BASE_SERVER_URL=https://backend.solshift.fun

# Optional
NEXT_PUBLIC_BASE_GMGN_URL=https://your-gmgn-server.com  # GMGN proxy (no localhost default)
```

> **Important:** `BAGS_API_KEY_SERVER` must be set. The app will warn on startup if required URLs are missing. There are no localhost fallbacks in production.

### Installation

```bash
git clone https://github.com/PJharwal/Bags-Terminal.git
cd Bags-Terminal

# Install dependencies
bun install   # or npm install

# Start development server
bun dev       # or npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Optional: Local GMGN Server

For full token analytics (holders, traders, security data):

```bash
cd gmgn-server-main/gmgn-server-main
pip install -r requirements.txt
python server.py  # Runs on http://localhost:8000
```

Set `NEXT_PUBLIC_BASE_GMGN_URL=http://localhost:8000` in `.env.local`.

## Architecture

```
src/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Home (hero, quick actions, live tokens)
│   ├── pulse/page.tsx            # Real-time pulse monitor
│   ├── terminal/page.tsx         # Terminal index (trending + search)
│   ├── terminal/[tokenId]/page.tsx  # Token detail terminal
│   ├── trending/page.tsx         # Trending + BAGS fee leaders
│   ├── analyze/page.tsx          # Token risk analysis
│   ├── creator/page.tsx          # Creator dashboard
│   ├── launch/page.tsx           # Token launch flow
│   ├── deployers/page.tsx        # Deployer intelligence
│   ├── error.tsx                 # Root error boundary
│   └── api/                      # API proxy routes
│       ├── bags/[...path]/       # bags.fm proxy (rate-limited, authed)
│       ├── gmgn/[...path]/       # GMGN proxy (local + public fallback)
│       └── dexscreener/[...path]/ # DexScreener proxy
│
├── components/
│   ├── TopBar.tsx                # Navigation (all 8 routes)
│   ├── bags/                     # BAGS-specific (FeeLeaders, LaunchFeed, Tokens)
│   ├── creator/                  # Creator dashboard tabs
│   ├── launch/                   # Token launch form components
│   ├── pulse/                    # Pulse monitor (columns, cards, drawer)
│   ├── terminal/                 # Terminal (header, trade panel, fee earners)
│   ├── credibility/              # Credibility matrix
│   ├── drawers/                  # Drawer shell + token drawer
│   ├── wallet/                   # Solana wallet provider + button
│   └── ui/                       # Primitives (Toast, Skeleton, ErrorBoundary)
│
├── store/                        # Zustand stores
│   ├── socket.store.ts           # WebSocket connection + events
│   ├── pulse.store.ts            # Pulse view state + BAGS filter
│   ├── terminal.store.ts         # Token detail + trade panel
│   ├── wallet.store.ts           # Wallet + transaction history
│   ├── creator.store.ts          # Creator dashboard + admin tokens
│   ├── launch.store.ts           # Token launch form state
│   ├── selection.store.ts        # Token/drawer selection
│   ├── social.store.ts           # Social linking
│   └── referral.store.ts         # Referral state
│
├── services/                     # API service layer
│   ├── bags.service.ts           # bags.fm: launch, swap, fees, admin, dexscreener
│   ├── bags-tokens.service.ts    # BAGS token discovery + validation
│   ├── gmgn.service.ts           # GMGN: trending, security, holders, traders
│   ├── dexscreener.service.ts    # DexScreener: trending, pairs, profiles
│   └── token.service.ts          # Unified token service (GMGN -> DexScreener fallback)
│
├── hooks/                        # Custom React hooks
│   ├── useTokenData.ts           # Token detail fetching
│   ├── useBagsFees.ts            # Fee data with auto-refresh
│   ├── useFeeData.ts             # Per-token fee data (extracted)
│   ├── useSwapQuote.ts           # Debounced swap quotes
│   ├── useSolPrice.ts            # SOL/USD price
│   └── useWallet.ts              # Wallet context
│
├── skills/                       # Modular analysis engines
│   ├── analyze/                  # Token audit, holders, traders adapters
│   └── shared/                   # Wallet classifier, heuristics
│
├── lib/                          # Utilities
│   ├── types.ts                  # Core app types
│   ├── bags-types.ts             # bags.fm types (SDK + custom)
│   ├── constants.ts              # Shared constants (SOL_PRICE)
│   ├── credibility.ts            # Credibility scoring
│   ├── lifecycle.ts              # Token lifecycle utils
│   ├── format.ts                 # Number/date formatting
│   └── utils.ts                  # General utils (cn)
│
└── config/
    └── env.ts                    # Environment config
```

## API Integration

### bags.fm API (via `/api/bags/` proxy)

All requests proxied server-side with API key protection and rate limiting (60 req/min per IP).

| Category | Endpoints |
|----------|-----------|
| Token Launch | create-token-info, create-launch-transaction, feed |
| Fee Share | config, admin/transfer, admin/update-config, admin/list |
| Trading | quote, swap |
| Fee Claiming | claim-txs/v3 (auto), claimable-positions, lifetime-fees |
| Creators | creator/v3, claim-stats, claim-events |
| Partner | config, stats, claim |
| Social | wallet/v2, wallet/v2/bulk |
| Dexscreener | create-order, order-availability, submit-payment |
| Pools | bags/pools, pools/token-mint |

### GMGN API (via `/api/gmgn/` proxy)

Falls back from local server (1.5s timeout) to public API (3s timeout).

| Endpoint | Purpose |
|----------|---------|
| `/trending` | Trending tokens by timeframe |
| `/token/info` | Token metadata + stats |
| `/token/security` | Security analysis |
| `/token/holders` | Top holders list |
| `/token/traders` | Top traders list |

### DexScreener API (via `/api/dexscreener/` proxy)

| Endpoint | Purpose |
|----------|---------|
| `/token-boosts/latest` | Latest boosted tokens |
| `/token-profiles/latest` | Latest token profiles |
| `/pairs/solana/*` | Pair data for Solana tokens |

## WebSocket Events

Connected to `backend.solshift.fun` via Socket.IO.

| Room | Event | Description |
|------|-------|-------------|
| `new_tokens:all` | `new_token` | New token created on-chain |
| `trades:all` | `trade` | Trade executed (buy/sell) |
| `migrations:all` | `migration` | Token migrated to DEX |

## Security

- API keys stored server-side only (`BAGS_API_KEY_SERVER`)
- No `NEXT_PUBLIC_` API key fallbacks in server routes
- Rate limiting on all proxy endpoints (60 req/min)
- IP detection: `cf-connecting-ip` > `x-real-ip` > `x-forwarded-for`
- Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Error boundaries at root and token detail routes
- Credibility scores tagged `real` vs `synthetic` with UI warning
- Wallet integration via official Solana wallet-adapter (Phantom, Solflare, Coinbase, Trust)

## Scripts

```bash
bun dev          # Development server (Turbopack)
bun run build    # Production build
bun start        # Production server
bun run lint     # ESLint
npx tsc --noEmit # Type check
```

## License

MIT
