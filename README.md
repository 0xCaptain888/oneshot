<div align="center">

<img src="https://img.shields.io/badge/UXmaxx_Hackathon-7702_Collective-7C5CFF?style=for-the-badge&logo=ethereum&logoColor=white" />
<img src="https://img.shields.io/badge/Built_on-Particle_Universal_Accounts-19C2B6?style=for-the-badge" />
<img src="https://img.shields.io/badge/Chain-Arbitrum_One-28A0F0?style=for-the-badge&logo=arbitrum&logoColor=white" />

<br /><br />

<h1>⚡ OneShot</h1>

<p><strong>Crypto's most painful UX problem, solved in three clicks.</strong></p>

<p>
  Fund from any chain in one click &nbsp;·&nbsp;
  Take a position with one signature &nbsp;·&nbsp;
  Hand it to a scoped AI agent
</p>

<br />

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-oneshot--adgssky5l-0xcaptain888s--projects.vercel.app-7C5CFF?style=for-the-badge)](https://oneshot-adgssky5l-0xcaptain888s-projects.vercel.app)
&nbsp;
[![Try Mock Mode](https://img.shields.io/badge/🎮_Try_Mock_Mode-No_wallet_needed-19C2B6?style=for-the-badge)](https://oneshot-adgssky5l-0xcaptain888s-projects.vercel.app)

</div>

---

## The Problem

Every prediction market, every DeFi app, every on-chain bet today starts with the same friction:

> *"You have USDC on Base. The market you want is on Arbitrum. You need ETH for gas. Bridge first. Wait. Now swap. Now sign."*

Four steps before you've done anything. Most users give up. The ones who don't become power users — a ceiling that caps every app in the space.

**OneShot removes the ceiling.**

---

## What It Does

OneShot is a chain-abstracted prediction and trading terminal. A brand-new user with assets scattered across any chains can:

| | Action | What happens underneath |
|---|--------|------------------------|
| **1** | Log in with email | Self-custodial Universal Account created instantly — no seed phrase, no extension |
| **2** | Click **Fund $50** | Assets pooled from every chain they hold, zero bridge UI |
| **3** | Pick YES or NO | Cross-chain position opened in **one signature** — gas paid in any token |
| **4** | Toggle **Autopilot** | Scoped AI agent settles winners, hedges losers, deploys idle cash — within hard limits they set |

The user never sees a chain selector. Never picks a gas token. Never opens a bridge. **The chains are invisible by design.**

---

## The Three Magic Moments

### ① Zero-to-Funded
```
Email login  →  click Fund $50  →  balance appears
```
Money arrives from wherever they hold it — USDC on Base, ETH on Optimism, USDT on Polygon — consolidated in under 3 seconds via Particle Universal Accounts. No bridge. No approval. One tap.

### ② One Signature
```
Pick a market  →  choose YES / NO  →  confirm
```
A single EIP-7702 UserOperation draws liquidity across chains, settles on Arbitrum, and opens the position. The user sees one "Confirm" button. Underneath: multi-chain asset routing, paymaster-sponsored gas, cross-chain settlement.

### ③ Agent Autopilot
```
Toggle Autopilot  →  set $50 cap  →  it runs
```
A scoped AI agent (rules engine + DeepSeek V4 explanation layer) monitors open positions and acts within strict limits the user controls: spend cap, tx cap, expiry, permission to open new positions. Hard limits enforced server-side — the agent **cannot exceed them**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    OneShot Frontend                      │
│                                                         │
│  Login (email OTP)  →  ParticleAuthProvider             │
│  Balance            →  Universal Account SDK            │
│  Fund               →  createTransferTransaction()      │
│  Position           →  createUniversalTransaction()     │
│  Close/Sell         →  opposite-side tx (not hardcoded) │
│  Agent              →  POST /api/agent                  │
│                              ↓                          │
│               Rules Engine (deterministic)              │
│               + DeepSeek V4 (explanation only)          │
└─────────────────────────────────────────────────────────┘
         ↓                              ↓
  Particle Universal            Arbitrum One
  Accounts (EIP-7702)         (settlement chain)
         ↓
  ETH · Base · Polygon · Optimism · BNB
  (source chains — user never picks)
```

### Key Design Decisions

**Service interface pattern** — `UniversalAccountService` is the only thing the UI knows. Mock and Live implement the same interface identically. Swap keys in `.env` to go from demo → real chain.

**Agent is bounded by construction** — the AI never decides actions. A deterministic rules engine decides (settle winners ≥85% probability, hedge losers ≤20%, deploy idle cash). DeepSeek V4 only rephrases the plan in natural language.

**No chain selector ever** — chains appear only in the "Under the hood" debug panel, which is collapsed by default and exists to prove the abstraction is real.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Chain abstraction | **Particle Universal Accounts + EIP-7702** | Cross-chain asset pooling, single-sig ops |
| Authentication | **Particle Auth Core Modal v1.5.2** | Email OTP → embedded wallet, no seed phrase |
| Settlement chain | **Arbitrum One** | Low fees, ZeroDev-native, Offchain Labs ecosystem |
| Smart accounts | **ZeroDev (Kernel)** | Session keys, paymasters, batched ops |
| Agent permissions | **Openfort scoped keys** | Revocable, spend-capped agent delegation |
| Settlement token | **USDC** | Everything denominated in dollars, chains invisible |
| AI | **DeepSeek V4** (`deepseek-chat`) | Agent explanation layer — never action generation |
| Framework | **Next.js 14 App Router** | One repo: UI + serverless agent API |
| Styling | **Tailwind CSS** | Dark terminal aesthetic, no design system overhead |
| State | **Zustand** | Global store, zero boilerplate |

---

## Run Locally

```bash
# Clone and install
git clone https://github.com/0xCaptain888/oneshot.git
cd oneshot && npm install

# Run in demo mode — no keys, no wallet, full UI
NEXT_PUBLIC_MOCK_MODE=true npm run dev

# Or with real Particle keys for live mode
cp .env.example .env.local
# Fill in NEXT_PUBLIC_PARTICLE_* + DEEPSEEK_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — try any email, click through all three flows.

---

## How the Sponsors' Tech Is Used

| Sponsor | Integration | Where in code |
|---------|------------|---------------|
| **Particle Network** | Universal Accounts for cross-chain asset pooling + EIP-7702 single-sig ops + email OTP embedded wallets | `src/lib/particle/` |
| **Arbitrum** | Primary settlement chain for all positions and transfers | `src/config/index.ts` |
| **ZeroDev** | Session keys for scoped agent permissions, paymaster for gas abstraction | `src/lib/particle/live.ts` |
| **Openfort** | Revocable agent delegation with spend caps | `src/components/AgentPanel.tsx` |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # ParticleAuthProvider wraps entire app
│   ├── page.tsx
│   └── api/agent/route.ts      # Agent: rules engine + DeepSeek V4
├── components/
│   ├── ParticleLoginButton.tsx # Particle hooks at component top level (correct React pattern)
│   ├── BalanceCard.tsx         # Unified balance + "under the hood" per-chain view
│   ├── MarketList.tsx          # Markets + inline YES/NO position entry
│   ├── PositionsList.tsx       # Open positions + Close/Sell
│   └── AgentPanel.tsx          # Permission sliders + agent run + report
├── lib/
│   ├── particle/
│   │   ├── authProvider.tsx    # AuthCoreContextProvider wrapper
│   │   ├── universalAccount.ts # Service interface + Mock + factory
│   │   └── live.ts             # Particle SDK adapter (opaqueRequire pattern)
│   └── agent/rules.ts          # Deterministic rules engine (server-side)
└── types/
    ├── index.ts                # Shared domain types
    └── particle.d.ts           # SDK ambient declarations
```

---

## Why This Wins

The UXmaxx brief is "push crypto toward its current potential." The organizer's (Particle Network) own published roadmap names three next products: Universal Accounts V2 tuned for trading, a Universal Deposit SDK, and Universal Agent Accounts.

OneShot ships all three as working software in a single demo:

- **Universal Deposit** → the Fund flow (magic moment #1)
- **Universal Accounts V2 for trading** → the one-signature position (moment #2)  
- **Universal Agent Accounts** → the scoped autopilot (moment #3)

We're not building on the roadmap. We're building *the* roadmap.

---

## License

MIT — see [LICENSE](./LICENSE)

---

<div align="center">

Built with ❤️ for the [UXmaxx Hackathon](https://www.encodeclub.com/programmes/uxmaxx-hackathon) · 7702 Collective · Particle Network

**[Live Demo](https://oneshot-adgssky5l-0xcaptain888s-projects.vercel.app) · [Mock Demo](https://oneshot-adgssky5l-0xcaptain888s-projects.vercel.app) · [Docs](./DEVELOPMENT.md)**

</div>
