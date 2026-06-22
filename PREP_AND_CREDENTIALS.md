# OneShot — Prep & Credentials Guide

**Everything you need to gather to run OneShot, with exactly where to get each item.**
This is FILE 3 of 3 (`README.md` and `DEVELOPMENT.md` are the other two).

> **TL;DR:** You can run and demo the whole app with **nothing** — mock mode needs zero keys. You only need the items below to switch to **live mode** (real on-chain transactions) and to submit to the hackathon.

---

## 0. Quick decision: do you even need keys right now?

| If you want to… | You need |
|------------------|----------|
| See the UI, click through all 3 flows, record a UI demo | **Nothing.** Just `npm install && npm run dev`. |
| Do a **live** on-chain demo (real balances, real txns) | Particle keys + a funded wallet (Sections 1–3) |
| Let the agent **explain** itself in natural language | A DeepSeek V4 API key (Section D) |
| Submit to the hackathon | A GitHub repo + a deployed URL + a demo video (Section 6) |

Gather things in this order: **A → B → C → D**. Each section says whether it's required or optional.

---

## A. Particle Network credentials — *required for live mode*

These three values flip the app from mock to live. Without `PROJECT_ID`, the app stays in mock mode.

**Where to get them:**
1. Go to the **Particle Dashboard**: <https://dashboard.particle.network>
2. Sign in (email or wallet) and **create a new project** (e.g. "OneShot").
3. Inside the project, **create an app** (choose "Web").
4. Copy these three values from the project/app settings:

| Value | Env var | Notes |
|-------|---------|-------|
| Project ID | `NEXT_PUBLIC_PARTICLE_PROJECT_ID` | A UUID-looking string |
| Client Key | `NEXT_PUBLIC_PARTICLE_CLIENT_KEY` | Client-side key (safe in browser) |
| App ID | `NEXT_PUBLIC_PARTICLE_APP_ID` | The web app's id |

5. Put them in `.env.local`:
```bash
NEXT_PUBLIC_PARTICLE_PROJECT_ID=your_project_id
NEXT_PUBLIC_PARTICLE_CLIENT_KEY=your_client_key
NEXT_PUBLIC_PARTICLE_APP_ID=your_app_id
```

> Particle's Universal Account / Chain Abstraction product is **free for developers**. If the dashboard's product names or key labels differ from the above (their UI evolves), match by meaning: a project identifier, a client/publishable key, and an app identifier. The integration points in `src/lib/particle/live.ts` and `src/hooks/useAuth.ts` are marked `// >>> SDK:` so you can align them with the current docs at <https://developers.particle.network>.

**Domain allow-list:** In the Particle dashboard, add the domains the app will run on to the project's allowed domains:
- `http://localhost:3000` (local dev)
- your deployed URL (e.g. `https://oneshot.vercel.app`)

---

## B. A wallet & test funds — *required for a live on-chain demo*

You asked specifically about **wallet addresses** — here's exactly what's needed and what's *not*.

### What the END USER needs
**Nothing to pre-create.** The whole point of OneShot is that the user logs in with **email**, and Particle creates an embedded wallet + Universal Account for them automatically. There is no "paste your wallet address" step for users.

### What YOU (the builder) need for a live demo
To show real transactions in your demo video, the logged-in demo account needs a little money on some chain:

1. **Decide: testnet or mainnet.**
   - **Testnet (recommended for a hackathon):** free, safe. Use a testnet like **Arbitrum Sepolia**. Set `NEXT_PUBLIC_PRIMARY_CHAIN_ID` to the testnet's chain id and adjust the chain entry in `src/lib/chains/index.ts` if needed.
   - **Mainnet:** more impressive ("real money") but you risk real funds. Keep amounts tiny ($5–$20).

2. **Get test funds into the demo account:**
   - Log into the running app with your demo email so Particle generates the embedded wallet, then **copy that wallet address** from the header (the app shows it) or from the Particle dashboard.
   - Send a small amount of **USDC** (and a little native gas token, if the flow needs it) to that address on one chain. For testnet, use a faucet:
     - Arbitrum Sepolia ETH faucet (search "Arbitrum Sepolia faucet")
     - Testnet USDC faucet (e.g. Circle's testnet faucet: <https://faucet.circle.com>)
   - The demo premise works best if the funds start on a **different** chain than the settlement chain — that's what makes "fund from any chain" visible.

3. **Settlement chain & token (already defaulted):**
   - `NEXT_PUBLIC_PRIMARY_CHAIN_ID=42161` (Arbitrum One) — the chain the app "lives" on.
   - `NEXT_PUBLIC_SETTLEMENT_TOKEN_SYMBOL=USDC` — everything is denominated in USDC.
   - Change these if you demo on a different chain/token.

> **You do NOT need:** a hardware wallet, a pre-funded treasury contract, a deployed token, or a multisig. A single email-login account with a few test dollars is enough for the full demo.

### Optional: a contract address for real positions
In `src/lib/particle/live.ts`, `openPosition()` currently sends a **placeholder** contract call (`to: 0x000…0`). For a fully-real position you'd point this at:
- a real prediction-market contract you integrate, **or**
- a minimal contract you deploy on the settlement chain for the demo.

If you deploy your own, you'll have **one contract address** to paste into that call. This is optional — the funding + agent flows are fully demonstrable without it.

---

## C. Sponsor SDK accounts — *optional, for bounty depth*

OneShot is designed so one codebase qualifies for several sponsor bounties. To integrate each sponsor's product for real (and strengthen those bounty submissions), you may want accounts/keys from:

| Sponsor | What you'd get | Where | Needed? |
|---------|----------------|-------|---------|
| **Magic** | Publishable API key for email/social login | <https://magic.link> dashboard | Optional — Particle Connect can cover login |
| **ZeroDev** | Project id / bundler + paymaster (on Arbitrum) | <https://dashboard.zerodev.app> | Optional — for session keys + gas sponsorship |
| **Openfort** | API keys for scoped agent session keys | <https://dashboard.openfort.io> | Optional — for the agent's on-chain permissions |
| **Arbitrum** | No key needed; just deploy/settle on Arbitrum | n/a | Already the default chain |

> For the **demo and mock mode you need none of these.** Add them only when you wire the corresponding live integration and want to claim that sponsor's bounty. If you add their SDKs, create matching env vars (e.g. `NEXT_PUBLIC_MAGIC_API_KEY`, `NEXT_PUBLIC_ZERODEV_PROJECT_ID`, `OPENFORT_SECRET_KEY`) and follow each SDK's quickstart.

---

## D. DeepSeek V4 API key — *optional, agent explanations*

The agent works without it (deterministic rules + a built-in summary). Add a key only if you want the agent's report written in nicer natural language.

1. Get a key at <https://platform.deepseek.com> → API Keys.
2. Add it to `.env.local` (server-only — **no** `NEXT_PUBLIC_` prefix):
```bash
DEEPSEEK_API_KEY=sk-...
```
3. The app auto-detects it; the agent report will be tagged **"LLM-explained"** instead of "rules engine".

---

## E. Agent guardrail settings — *optional, has safe defaults*

Server-side hard caps the agent can never exceed (defaults shown):
```bash
AGENT_MAX_SPEND_USD=100   # max total USD the agent may move per run
AGENT_MAX_TX_PER_RUN=5    # max transactions per run
```
Leave them as-is unless you want tighter/looser limits. The user's in-app sliders can only go *down* from these.

---

## F. GitHub & deployment — *required to submit*

1. **GitHub repo:**
   - Create a new repo at <https://github.com/new> (e.g. `oneshot`).
   - Push this project (see the upload instructions you received with the code).
2. **Deploy (Vercel, recommended):**
   - <https://vercel.com/new> → import the repo → framework auto-detects **Next.js**.
   - Add any env vars from `.env.example` in the Vercel project settings (you can deploy in mock mode with none).
   - Deploy → copy the public URL for your submission.
3. **Demo video + deck:** record a ≤3-minute video (magic moment first 15s) and a short deck.

---

## G. Final checklist — copy/paste and tick off

**To run locally (mock mode):**
- [ ] Node.js ≥ 18.18 installed
- [ ] `npm install` succeeded
- [ ] `npm run dev` opens http://localhost:3000

**To go live:**
- [ ] Particle `PROJECT_ID`, `CLIENT_KEY`, `APP_ID` in `.env.local`
- [ ] Localhost + deployed domain added to Particle's allowed domains
- [ ] Demo email logged in once; embedded wallet address copied
- [ ] A few test dollars (USDC) sent to that address on a chain (ideally not the settlement chain)
- [ ] `NEXT_PUBLIC_PRIMARY_CHAIN_ID` / `SETTLEMENT_TOKEN_SYMBOL` set to your demo chain/token
- [ ] (Optional) market contract address wired into `openPosition()`

**Optional enhancers:**
- [ ] `DEEPSEEK_API_KEY` for LLM agent explanations
- [ ] Magic / ZeroDev / Openfort keys for deeper sponsor integrations

**To submit:**
- [ ] Code pushed to GitHub
- [ ] App deployed to a public URL (works in incognito)
- [ ] ≤3-min demo video (magic moment in first 15s)
- [ ] Short deck with an architecture diagram
- [ ] Submitted to every eligible sponsor bounty

---

## H. Security notes

- **Never commit `.env.local`.** It's already in `.gitignore`.
- Only `NEXT_PUBLIC_`-prefixed vars reach the browser. Keep secrets (DeepSeek key, any sponsor *secret* keys, agent caps) **without** that prefix so they stay server-side.
- For a public demo, prefer **testnet** or tiny mainnet amounts. The agent's hard caps add a second layer of protection, but small balances are the simplest safety net.
- Rotate any key that you ever paste into a screenshot or video.
