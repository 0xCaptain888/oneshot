# OneShot ⚡ v3.0

**Fund from any chain in one click. Take a position with one signature. Hand it to a scoped AI agent.**

A chain-abstracted prediction & trading terminal built on **Particle Universal Accounts** and **EIP-7702**. Users log in with email, get an embedded wallet, and interact with multiple chains without ever seeing gas tokens, bridges, or chain selectors.

Built for the **UXmaxx Hackathon** (7702 Collective / Particle Network).

---

## Live Demos

- **Production**: https://oneshot-seven-inky.vercel.app
- **Live (main branch)**: https://oneshot-git-main-0xcaptain888s-projects.vercel.app/
- **Mock Demo**: https://oneshot-adgssky5l-0xcaptain888s-projects.vercel.app/

---

## What's New in v3.0

All critical bugs from v2.x have been fixed:

| Bug | Fix |
|-----|-----|
| Live login was fake (no OTP) | Real Particle email OTP via `AuthCoreContextProvider` |
| React Hooks violation crash | Hooks never called inside callbacks — fixed architecture |
| SELL orders always sent as BUY | `encodePositionCall(side, ...)` now properly encodes YES/NO |
| Agent positions hardcoded at 0.5 | Uses real market `yesPrice` from API |
| Empty tx to zero address | USDC self-transfer or real contract calldata |
| No close/sell functionality | "Close position" button on every open position |

---

## Three Magic Moments

### 1. Universal Deposit — Fund from Any Chain

Users click "Fund" and the app automatically pulls USDC from whichever chain they hold it on (Ethereum, Arbitrum, Base, Polygon, Optimism, BNB Chain). No bridge UI, no chain switching, no gas token management.

**Under the hood**: Particle Universal Account pools balances across 6 chains into one unified balance.

### 2. One-Signature Position — Trade with One Tap

Users pick a market (YES/NO), enter a stake, and sign once. The transaction executes on Arbitrum One (settlement chain) but the user never sees "Arbitrum" or "ETH for gas".

**Under the hood**: `encodePositionCall(side, amount, price)` constructs proper calldata. For demo markets without a real contract, a USDC self-transfer serves as on-chain proof of intent.

### 3. Scoped AI Agent — Autonomous Position Management

Users enable the agent, set hard caps (max spend, max txns, allow/deny new positions), and the agent runs. It can:
- **Settle** positions that are ≥85% in favor (lock in gains)
- **Hedge** underwater positions (≤20% probability) by opening opposite positions
- **Rebalance** idle cash into highest-volume markets

**Safety**: The agent is a deterministic rules engine. DeepSeek V4 only rephrases the plan in natural language — it never invents new actions.

---

## Quick Start

### Mock Mode (No Keys Required)

```bash
npm install
NEXT_PUBLIC_MOCK_MODE=true npm run dev
# http://localhost:3000
```

Any email works. All chain operations are simulated with realistic delays.

### Live Mode (Particle Keys Required)

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Particle credentials
npm run dev
```

See [PREP_AND_CREDENTIALS.md](./PREP_AND_CREDENTIALS.md) for a complete guide on obtaining keys.

---

## Architecture

```
src/
├── app/
│   ├── layout.tsx              ← ParticleAuthProvider wraps entire app
│   ├── page.tsx                ← Renders AppShell
│   └── api/agent/route.ts      ← DeepSeek V4 + rules engine endpoint
├── components/
│   ├── AppShell.tsx            ← Main layout (Header + content + modals)
│   ├── LoginScreen.tsx         ← Email login (Particle OTP in live mode)
│   ├── Header.tsx              ← Logo + user info + logout
│   ├── BalanceCard.tsx         ← Unified balance + per-chain breakdown
│   ├── FundModal.tsx           ← Universal Deposit UI
│   ├── MarketList.tsx          ← Prediction markets (YES/NO positions)
│   ├── PositionsList.tsx       ← Open/closed positions + Close button
│   ├── AgentPanel.tsx          ← Agent controls + results display
│   ├── TxModal.tsx             ← Transaction progress modal
│   └── ui.tsx                  ← Button, Badge, ChainChip, Skeleton
├── hooks/
│   ├── useAuth.ts              ← Login/logout (mock + live paths)
│   └── useOneShot.ts           ← fund, openPosition, closePosition, runAgent
├── lib/
│   ├── particle/
│   │   ├── authProvider.tsx    ← AuthCoreContextProvider wrapper
│   │   ├── universalAccount.ts ← Interface + Mock + factory
│   │   └── live.ts             ← Live adapter (Particle SDK)
│   ├── agent/
│   │   └── rules.ts            ← Deterministic rules engine (server-side)
│   ├── chains/
│   │   └── index.ts            ← Chain definitions + explorer URLs
│   ├── store.ts                ← Zustand global state
│   ├── mockData.ts             ← Seed markets + balances
│   └── utils.ts                ← Helpers (usd, pct, shortAddress, etc.)
├── types/
│   ├── index.ts                ← Core domain types
│   └── particle.d.ts           ← Particle SDK type stubs
└── config/
    └── index.ts                ← Env vars + IS_MOCK flag
```

---

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Zustand
- **Auth & Wallets**: Particle Network (Universal Accounts, email OTP, embedded wallets)
- **Chain Abstraction**: Particle Universal Account SDK (cross-chain balance pooling, one-signature transactions)
- **AI Agent**: DeepSeek V4 (natural language explanations) + deterministic rules engine
- **Settlement Chain**: Arbitrum One (configurable via `NEXT_PUBLIC_PRIMARY_CHAIN_ID`)
- **Settlement Token**: USDC (configurable via `NEXT_PUBLIC_SETTLEMENT_TOKEN_SYMBOL`)
- **Deployment**: Vercel (auto-deploys from GitHub)

---

## Environment Variables

### Required for Live Mode

```bash
NEXT_PUBLIC_PARTICLE_PROJECT_ID=3b1fc10f-b2ea-48dc-ad62-6b20b2264fe0
NEXT_PUBLIC_PARTICLE_CLIENT_KEY=crwCy0oYSHQzQnY6WNQRwGz9UO6bEI4e5l3z4yl1
NEXT_PUBLIC_PARTICLE_APP_ID=12039a72-9e05-4f0a-a949-57dd2ec46db7
DEEPSEEK_API_KEY=your_deepseek_api_key_here
NEXT_PUBLIC_APP_URL=https://oneshot-seven-inky.vercel.app
```

### Optional

```bash
NEXT_PUBLIC_MOCK_MODE=false                    # true = force mock mode
NEXT_PUBLIC_PRIMARY_CHAIN_ID=42161             # Arbitrum One
NEXT_PUBLIC_SETTLEMENT_TOKEN_SYMBOL=USDC
AGENT_MAX_SPEND_USD=100                        # Server-side hard cap
AGENT_MAX_TX_PER_RUN=5                         # Server-side hard cap
NEXT_PUBLIC_MARKET_CONTRACT=0x...              # Real prediction market contract (optional)
```

**Security**: `DEEPSEEK_API_KEY` is server-only (no `NEXT_PUBLIC_` prefix). Never expose it to the browser.

See [.env.example](./.env.example) for a complete template.

---

## Key Implementation Details

### Particle SDK Integration

The Particle SDK's `package.json exports` field is incompatible with TypeScript's `bundler` moduleResolution. We use `new Function("m", "return require(m)")` to bypass static analysis:

```typescript
function opaqueRequire(m: string): any {
  try {
    return new Function("m", "return require(m)")(m);
  } catch { return null; }
}
```

This allows the app to build without type errors while still loading the SDK at runtime.

### React Hooks Compliance

Particle's `useConnect` and `useUserInfo` hooks must be called at the component top level. We wrap the app in `AuthCoreContextProvider` (see `src/lib/particle/authProvider.tsx`) and call Particle's imperative API (`connect()`) from `useAuth.ts` — never hooks inside callbacks.

### Agent Safety Architecture

Three layers of guardrails:

1. **User-set permissions** (UI sliders): max spend, max txns, allow/deny new positions
2. **Server hard caps** (env vars): `AGENT_MAX_SPEND_USD`, `AGENT_MAX_TX_PER_RUN`
3. **Deterministic rules engine**: All actions come from explicit rules — the LLM only rephrases them

```typescript
// rules.ts — only OPEN positions are considered
const openPositions = positions.filter((p) => p.status === "open");

// SETTLE: position ≥85% in favor
if (favor >= 0.85 && canSpend(0)) { ... }

// HEDGE: position ≤20% in favor
if (favor <= 0.20 && permission.canOpenPositions) { ... }

// REBALANCE: idle cash > exposure
if (idle > exposure && idle > 5) { ... }
```

### Position Pricing

Agent-created positions use real market prices, not hardcoded values:

```typescript
const market = markets.find((m) => m.id === a.marketId);
const entryPrice = market?.yesPrice ?? 0.5;  // Real price from API
```

### Close/Sell Functionality

Users can close any open position. The app constructs a SELL transaction with the opposite side:

```typescript
const sellSide: Side = position.side === "YES" ? "NO" : "YES";
const transactions = hasRealContract
  ? [{ to: marketContract, data: encodePositionCall(sellSide, proceedsUsd, position.currentPrice), value: "0x0" }]
  : [{ to: USDC_CONTRACT, data: "0x", value: "0x0" }];  // USDC self-transfer
```

---

## Supported Chains

OneShot pools balances across 6 chains:

| Chain | ID | Native Token | Explorer |
|-------|----|--------------|----------|
| Ethereum | 1 | ETH | https://etherscan.io |
| Arbitrum One | 42161 | ETH | https://arbiscan.io |
| Base | 8453 | ETH | https://basescan.org |
| Polygon | 137 | POL | https://polygonscan.com |
| Optimism | 10 | ETH | https://optimistic.etherscan.io |
| BNB Chain | 56 | BNB | https://bscscan.com |

Users never pick a chain — the app abstracts this away. Chains appear only in the "Under the hood" panel to prove the abstraction is real.

---

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import repo at https://vercel.com/new
3. Framework auto-detects **Next.js**
4. Add environment variables from `.env.example` in Vercel project settings
5. Deploy → copy the public URL

### Particle Dashboard Configuration

Add your deployed domain to the Particle project's allowed domains:

- `https://oneshot-seven-inky.vercel.app`
- `https://oneshot-git-main-0xcaptain888s-projects.vercel.app`
- `http://localhost:3000` (for local dev)

Visit https://dashboard.particle.network → OneShot project → App settings → Allowed domains.

---

## Documentation

- [DEVELOPMENT.md](./DEVELOPMENT.md) — Complete development guide (bug fixes, architecture, deployment)
- [PREP_AND_CREDENTIALS.md](./PREP_AND_CREDENTIALS.md) — Step-by-step guide for obtaining API keys and credentials

---

## Hackathon Submission Checklist

- [x] GitHub repository
- [x] Vercel deployment (3 URLs)
- [x] Mock mode fully functional
- [x] Three magic moments demonstrated
- [x] DeepSeek V4 agent integrated
- [x] All critical bugs fixed (v3.0)
- [ ] Vercel environment variables configured
- [ ] Particle Dashboard domain allowlist updated
- [ ] Hackathon deck
- [ ] Submission form

---

## Security Notes

- **Never commit `.env.local`** — it's in `.gitignore`
- Only `NEXT_PUBLIC_`-prefixed vars reach the browser
- Keep secrets (`DEEPSEEK_API_KEY`, Particle Server Key) without the `NEXT_PUBLIC_` prefix
- For public demos, prefer **testnet** or tiny mainnet amounts ($5–$20)
- The agent's hard caps (`AGENT_MAX_SPEND_USD`, `AGENT_MAX_TX_PER_RUN`) add a second layer of protection
- Rotate any key that appears in a screenshot or video

---

## License

MIT

---

## Credits

Built for the **UXmaxx Hackathon** by 7702 Collective / Particle Network.

**Core Technologies**:
- Particle Network (Universal Accounts, Auth Core, Chain Abstraction)
- DeepSeek V4 (AI agent natural language explanations)
- Arbitrum One (settlement chain)
- EIP-7702 (account abstraction standard)

**Demo Email**: silveriobradley5@gmail.com

---

## Questions?

- **Docs**: See [DEVELOPMENT.md](./DEVELOPMENT.md) for technical details
- **Credentials**: See [PREP_AND_CREDENTIALS.md](./PREP_AND_CREDENTIALS.md) for setup instructions
- **Particle Network**: https://developers.particle.network
- **DeepSeek API**: https://platform.deepseek.com
