# OneShot ⚡ v3.0

**Fund from any chain in one click. Take a position with one signature. Hand it to a scoped AI agent.**

Built for the **UXmaxx Hackathon** (7702 Collective / Particle Network).  
Live: https://oneshot-seven-inky.vercel.app | Demo: https://oneshot-adgssky5l-0xcaptain888s-projects.vercel.app

---

## What's fixed in v3.0

| Bug | Fix |
|-----|-----|
| Live login was fake (no OTP) | Real Particle email OTP via AuthCoreContextProvider |
| React Hooks violation crash | Hooks never called inside callbacks — fixed architecture |
| SELL orders always sent as BUY | `encodePositionCall(side, ...)` now properly encodes YES/NO |
| Agent positions hardcoded at 0.5 | Uses real market `yesPrice` |
| Empty tx to zero address | USDC self-transfer or real contract calldata |
| No close/sell functionality | "Close position" button on every open position |

---

## Quick start

```bash
npm install
cp .env.example .env.local   # already has Particle keys
npm run dev                   # http://localhost:3000
```

Mock mode (no keys needed):
```bash
NEXT_PUBLIC_MOCK_MODE=true npm run dev
```

---

## Architecture

```
ParticleAuthProvider (layout.tsx)
  └── AppShell
        ├── BalanceCard    — unified balance + per-chain breakdown
        ├── MarketList     — YES/NO positions, one signature
        ├── PositionsList  — open positions + Close/Sell button  ← NEW
        └── AgentPanel     — DeepSeek V4 + rules engine
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for full documentation.

---

## Tech stack

Particle Universal Accounts · EIP-7702 · DeepSeek V4 · Next.js 14 · Tailwind CSS · Zustand · Arbitrum
