# Bags Terminal Conversion Plan

## Overview

Convert the app to focus on **Bags Terminal** functionality - displaying Bags.fm-specific data (fees, earnings, fee earners) alongside GMGN market data (price, volume, market cap, holders).

## Data Source Strategy

| Data Type | Source | Endpoint/Method |
|-----------|--------|-----------------|
| Token listings/trending | GMGN | `gmgnService.getTrending()` |
| Price, Volume, Market Cap | GMGN | `gmgnService.getTokenInfo()` |
| Holders count | GMGN | `gmgnService.getTokenHolders()` |
| **Lifetime fees earned** | Bags SDK | `stateService.getTokenLifetimeFees(mint)` |
| **Fee earners/creators** | Bags SDK | `stateService.getTokenCreators(mint)` |
| **Claim stats per earner** | Bags SDK | `stateService.getTokenClaimStats(mint)` |
| **Claim events history** | Bags SDK | `stateService.getTokenClaimEvents(mint)` |
| **Claimable positions** | Bags SDK | `feesService.getAllClaimablePositions(wallet)` |

## Key Bags SDK Methods

From `@bagsfm/bags-sdk`:

```typescript
// StateService methods
getTokenLifetimeFees(tokenMint: PublicKey): Promise<number>
getTokenCreators(tokenMint: PublicKey): Promise<TokenLaunchCreator[]>
getTokenClaimStats(tokenMint: PublicKey): Promise<TokenLaunchCreatorV3WithClaimStats[]>
getTokenClaimEvents(tokenMint: PublicKey, options?: {limit, offset}): Promise<TokenClaimEvent[]>

// FeesService methods
getAllClaimablePositions(wallet: PublicKey): Promise<BagsClaimablePosition[]>
```

### Types

```typescript
interface TokenLaunchCreator {
  username: string;
  pfp: string;
  royaltyBps: number;      // Fee share in basis points (100 = 1%)
  isCreator: boolean;
  wallet: string;
  provider: SocialProvider | 'unknown' | null;
  providerUsername: string | null;
}

interface TokenLaunchCreatorV3WithClaimStats extends TokenLaunchCreator {
  totalClaimed: string;    // Total SOL claimed
}

interface TokenClaimEvent {
  wallet: string;
  isCreator: boolean;
  amount: string;          // SOL amount
  signature: string;
  timestamp: number;
}
```

---

## Implementation Milestones

### Milestone 1: Enhance Bags Service with SDK Fee Methods

**Files to modify:**
- `src/services/bags.service.ts`

**Add new methods:**
```typescript
// Get total fees earned by a token
async function getTokenLifetimeFees(mint: string): Promise<number>

// Get all fee earners for a token
async function getTokenCreators(mint: string): Promise<TokenLaunchCreator[]>

// Get claim stats per earner (with amounts claimed)
async function getTokenClaimStats(mint: string): Promise<TokenLaunchCreatorV3WithClaimStats[]>

// Get claim history events
async function getTokenClaimEvents(mint: string, limit?: number, offset?: number): Promise<TokenClaimEvent[]>
```

**API proxy endpoints to add:**
- `GET /api/bags/token/lifetime-fees?mint=xxx`
- `GET /api/bags/token/creators?mint=xxx`
- `GET /api/bags/token/claim-stats?mint=xxx`
- `GET /api/bags/token/claim-events?mint=xxx&limit=50&offset=0`

---

### Milestone 2: Add Bags Fee Types

**Files to modify:**
- `src/lib/bags-types.ts`

**Add types:**
```typescript
export interface BagsTokenFeeInfo {
  mint: string;
  lifetimeFees: number;           // Total SOL fees earned
  creators: BagsTokenCreator[];   // Fee earners
}

export interface BagsTokenCreator {
  username: string;
  pfp: string;
  royaltyBps: number;             // 100 = 1%
  royaltyPercent: number;         // Computed: royaltyBps / 100
  isCreator: boolean;
  wallet: string;
  provider: SocialProvider | 'unknown' | null;
  providerUsername: string | null;
  totalClaimed?: string;          // If from claim-stats
}

export interface BagsClaimEvent {
  wallet: string;
  isCreator: boolean;
  amountSol: number;
  signature: string;
  timestamp: number;
}
```

---

### Milestone 3: Create useBagsFees Hook

**Files to create:**
- `src/hooks/useBagsFees.ts`

**Hook interface:**
```typescript
interface UseBagsFees {
  lifetimeFees: number | null;
  creators: BagsTokenCreator[];
  claimStats: TokenLaunchCreatorV3WithClaimStats[];
  claimEvents: BagsClaimEvent[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useBagsFees(tokenMint: string | null): UseBagsFees
```

---

### Milestone 4: Update TerminalToken Type

**Files to modify:**
- `src/lib/types.ts`

**Enhance TerminalToken:**
```typescript
export interface TerminalToken {
  // ... existing fields ...

  // Bags Fee Data
  lifetimeFees: number;           // Total fees earned (SOL)
  feeEarners: BagsTokenCreator[]; // List of fee earners
  topEarner?: {
    username: string;
    provider: string | null;
    royaltyPercent: number;
  };
}
```

---

### Milestone 5: Update Terminal Store to Fetch Bags Data

**Files to modify:**
- `src/store/terminal.store.ts`

**In `loadToken()` function:**
1. Keep existing GMGN data fetch
2. Add parallel fetch for Bags fee data
3. Merge into `activeToken`

```typescript
// In loadToken():
const [gmgnData, bagsFeeData] = await Promise.all([
  fetchTerminalTokenData(tokenId),
  bagsService.getTokenLifetimeFees(tokenId).catch(() => null),
  bagsService.getTokenCreators(tokenId).catch(() => []),
]);

// Merge into activeToken
set({
  activeToken: {
    ...gmgnData,
    lifetimeFees: bagsFeeData?.fees ?? 0,
    feeEarners: bagsFeeData?.creators ?? [],
  }
});
```

---

### Milestone 6: Update TerminalHeader to Show Bags Fee Data

**Files to modify:**
- `src/app/terminal/components/TerminalHeader.tsx`

**Changes:**
1. Display `lifetimeFees` in the stats row (replace placeholder FEES)
2. Add fee earner badge/indicator
3. Show top earner info if available

**UI:**
```
[TOKEN_IMAGE] $SYMBOL  NAME  [ADDRESS]
$1.234 (+12.34%)

MC: $1.2M | LIQ: $500K | VOL_24H: $2.3M | VOL_5M: $50K | HOLDERS: 1,234 | FEES: 12.5 SOL

Fee Earners: @username (50%), @another (30%), wallet... (20%)
```

---

### Milestone 7: Create FeeEarnersPanel Component

**Files to create:**
- `src/components/terminal/FeeEarnersPanel.tsx`

**Features:**
- Display list of fee earners for current token
- Show: avatar, username/wallet, provider icon, royalty %, total claimed
- Expandable/collapsible panel
- Link to social profiles where applicable

---

### Milestone 8: Add Fees Tab to TerminalBottomTabs

**Files to modify:**
- `src/app/terminal/components/TerminalBottomTabs.tsx`
- `src/lib/types.ts` (add 'fees' to TerminalBottomTab type)

**New tab: "FEES"**
- Shows claim events history for the token
- Columns: Time, Wallet, Amount (SOL), Signature (link)
- Real-time updates when new claims happen

---

### Milestone 9: Update Token Cards with Fee Indicators

**Files to modify:**
- Trending page token cards
- Home page token cards
- PulseCard component

**Add optional fee indicator:**
- Small icon/badge if token has Bags fee earners
- Tooltip showing top earner on hover
- Optional: Show lifetime fees in card

---

### Milestone 10: Discover Page Enhancement (Optional)

**Files to modify:**
- `src/app/discover/page.tsx` (if exists)
- Or create new discover page

**Features:**
- Filter by "Bags Tokens" (tokens with fee earners)
- Sort by lifetime fees earned
- Show fee earner info in list view

---

## API Proxy Implementation

### Add to `/api/bags/[...path]/route.ts`:

Handle new paths:
- `token/lifetime-fees` → SDK `getTokenLifetimeFees()`
- `token/creators` → SDK `getTokenCreators()`
- `token/claim-stats` → SDK `getTokenClaimStats()`
- `token/claim-events` → SDK `getTokenClaimEvents()`

**Note:** These need server-side implementation since SDK requires Connection and API key.

---

## UI Data Display Summary

| Location | Bags Data Shown |
|----------|-----------------|
| Terminal Header | Lifetime fees, top earner badge |
| Terminal Stats Row | FEES: X.XX SOL |
| Fee Earners Panel | Full list of earners with % and claimed amounts |
| Bottom Tabs (Fees) | Claim events history |
| Token Cards | Fee indicator badge (optional) |
| Discover Page | Filter/sort by fees (optional) |

---

## Dependencies

No new dependencies required - `@bagsfm/bags-sdk` already installed.

---

## Non-Goals (Keep Existing)

- GMGN integration for market data (keep as-is)
- Existing swap functionality (keep as-is)
- Launch page (keep as-is)
- Creator dashboard (keep as-is)

---

## Estimated Changes

| Milestone | Files | Effort |
|-----------|-------|--------|
| 1. Bags Service | 2 | Medium |
| 2. Types | 1 | Small |
| 3. Hook | 1 | Small |
| 4. TerminalToken | 1 | Small |
| 5. Terminal Store | 1 | Medium |
| 6. TerminalHeader | 1 | Medium |
| 7. FeeEarnersPanel | 1 | Medium |
| 8. Bottom Tabs | 2 | Medium |
| 9. Token Cards | 3 | Small |
| 10. Discover | 1 | Optional |

**Total: ~14 files, Medium overall effort**
