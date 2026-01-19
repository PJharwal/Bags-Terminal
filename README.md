# BAGS Terminal

A real-time token monitoring and analysis terminal for Solana, featuring live WebSocket data from the Solshift backend with BAGS token filtering.

## Features

### 🔥 Live Pulse Monitor
- **Real-time token feed** via WebSocket connection to `backend.solshift.fun`
- **3-column Kanban view**: INCOMING → PROCESSING → FINALIZED
- **BAGS token filter**: Toggle to show only tokens with CA ending in 'bags'
- **Live connection status** with auto-reconnect

### 📊 Terminal Analysis
- **Token analysis dashboard** with market cap, holders, volume
- **Risk assessment** with insider cluster detection
- **Deployer tracking** with success rate metrics
- **GeckoTerminal chart integration**

### 🔧 Skill Architecture
Modular skill-based architecture for extensibility:
- `skills/analyze/` - Token audit engine, holders/traders adapters
- `skills/shared/` - Wallet classifier, heuristics
- `store/` - Zustand stores for socket, pulse, terminal state

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Real-time**: Socket.IO Client
- **Charts**: GeckoTerminal Embed
- **Animation**: Framer Motion

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/PJharwal/Bags-Terminal.git
cd Bags-Terminal

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
├── app/
│   ├── pulse/          # Live pulse monitor page
│   ├── terminal/       # Token terminal page
│   └── analyze/        # Analysis page
├── components/
│   ├── pulse/          # Pulse page components
│   └── terminal/       # Terminal components
├── store/
│   ├── socket.store.ts # WebSocket connection
│   ├── pulse.store.ts  # Pulse state management
│   └── terminal.store.ts
├── skills/
│   ├── analyze/        # Token audit engine
│   └── shared/         # Shared utilities
├── types/
│   └── socket.ts       # Socket event types
└── config/
    └── env.ts          # Environment config
```

## Environment Variables

```env
NEXT_PUBLIC_BASE_SERVER_URL=https://backend.solshift.fun
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `/api/tokens?limit=20` | Fetch new tokens |
| `/api/tokens?status=graduating&hours=6` | Fetch graduating tokens |
| `/api/tokens?status=migrated&limit=20` | Fetch migrated tokens |

## Socket Events

- `new_token` - New token created
- `trade` - Trade executed
- `migration` - Token migrated to DEX

## BAGS Token Filter

The app filters for BAGS tokens by checking if the contract address (mint) ends with `bags`:

```typescript
const isBagsToken = (mint: string): boolean => {
    return mint.toLowerCase().endsWith('bags');
};
```

Toggle this filter in the UI with the "BAGS_ONLY" button.

## Screenshots

### Live Pulse Monitor
Real-time 3-column Kanban view showing token lifecycle states.

### Terminal Analysis
Detailed token analysis with charts and risk assessment.

## License

MIT
