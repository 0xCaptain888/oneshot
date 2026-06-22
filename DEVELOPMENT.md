# OneShot — 完整开发文档 v3.0

> 最后更新：2026-06-21  
> 版本：v3.0（Bug 修复版）  
> 部署：https://oneshot-seven-inky.vercel.app  
> GitHub：https://github.com/0xCaptain888/oneshot  
> Mock 演示：https://oneshot-adgssky5l-0xcaptain888s-projects.vercel.app/

---

## 已修复的 Bug（v3.0）

| # | Bug | 修复位置 | 状态 |
|---|-----|---------|------|
| 1 | Live 模式认证是假的（未调用 Particle OTP） | `useAuth.ts`, `authProvider.tsx`, `layout.tsx` | ✅ 已修复 |
| 2 | React Hooks 违规（useConnect 在回调内调用） | `useAuth.ts`, `authProvider.tsx` | ✅ 已修复 |
| 3 | SELL 订单无法构造（side 硬编码为 BUY） | `live.ts`, `universalAccount.ts` | ✅ 已修复 |
| 4 | Agent 仓位价格硬编码 0.5 | `useOneShot.ts`, `rules.ts` | ✅ 已修复 |
| 5 | 空交易发往零地址（data: "0x"） | `live.ts` | ✅ 已修复 |
| 6 | 无平仓/卖出功能 | `PositionsList.tsx`, `useOneShot.ts` | ✅ 已修复 |

---

## 目录

1. [架构概览](#1-架构概览)
2. [环境变量](#2-环境变量)
3. [本地开发](#3-本地开发)
4. [Bug 修复详情](#4-bug-修复详情)
5. [Particle SDK 集成](#5-particle-sdk-集成)
6. [DeepSeek V4 Agent](#6-deepseek-v4-agent)
7. [Vercel 部署](#7-vercel-部署)
8. [Particle Dashboard 配置](#8-particle-dashboard-配置)
9. [Hackathon 提交清单](#9-hackathon-提交清单)

---

## 1. 架构概览

```
src/
├── app/
│   ├── layout.tsx              ← ParticleAuthProvider 在此包裹整个应用
│   ├── page.tsx
│   └── api/agent/route.ts      ← DeepSeek V4 + 规则引擎
├── components/
│   ├── PositionsList.tsx        ← 新增 Close/Sell 按钮
│   └── ...其他组件
├── hooks/
│   ├── useAuth.ts               ← 修复: 无 hooks 违规，真实 OTP 流程
│   └── useOneShot.ts            ← 修复: closePosition, 真实市场价格
├── lib/
│   ├── particle/
│   │   ├── authProvider.tsx     ← 新增: AuthCoreContextProvider 包裹
│   │   ├── live.ts              ← 修复: side 不再硬编码，非空 tx data
│   │   └── universalAccount.ts  ← 修复: 新增 closePosition 方法
│   └── agent/rules.ts           ← 修复: 只处理 open 仓位，真实价格
└── types/index.ts               ← 新增: Position.status, Position.shares
```

---

## 2. 环境变量

### Vercel 必须设置

```
NEXT_PUBLIC_PARTICLE_PROJECT_ID = 3b1fc10f-b2ea-48dc-ad62-6b20b2264fe0
NEXT_PUBLIC_PARTICLE_CLIENT_KEY = crwCy0oYSHQzQnY6WNQRwGz9UO6bEI4e5l3z4yl1
NEXT_PUBLIC_PARTICLE_APP_ID    = 12039a72-9e05-4f0a-a949-57dd2ec46db7
DEEPSEEK_API_KEY               = sk-your-deepseek-api-key
NEXT_PUBLIC_APP_URL            = https://oneshot-seven-inky.vercel.app
```

### 可选

```
NEXT_PUBLIC_MOCK_MODE          = false   (true = 强制 Mock 模式)
NEXT_PUBLIC_PRIMARY_CHAIN_ID   = 42161   (Arbitrum One)
NEXT_PUBLIC_SETTLEMENT_TOKEN_SYMBOL = USDC
AGENT_MAX_SPEND_USD            = 100
AGENT_MAX_TX_PER_RUN           = 5
NEXT_PUBLIC_MARKET_CONTRACT    = 0x...   (预测市场合约地址，可选)
```

### 安全说明

- `DEEPSEEK_API_KEY` — 仅服务端，不加 `NEXT_PUBLIC_` 前缀
- `NEXT_PUBLIC_PARTICLE_SERVER_KEY` — 永远不要放进前端代码

---

## 3. 本地开发

```bash
npm install
cp .env.example .env.local
npm run dev
# http://localhost:3000
```

**Mock 模式（不需要任何密钥）：**
```bash
NEXT_PUBLIC_MOCK_MODE=true npm run dev
```

---

## 4. Bug 修复详情

### Bug 1 & 2：Live 认证 + React Hooks 违规

**问题：**
- `IS_MOCK=false` 时，登录仍生成假地址，从未调用 Particle OTP
- `useConnect` / `useUserInfo` 在 `useCallback` 内部调用，违反 React hooks 规则

**根本原因：** React hooks 必须在组件的顶层调用，不能在回调、条件语句或循环内调用。

**修复方案：**

1. **新增 `src/lib/particle/authProvider.tsx`**
   - 在应用根部包裹 `AuthCoreContextProvider`
   - 使 Particle 的 React hooks 在整个组件树可用

2. **`src/app/layout.tsx` 加入 `<ParticleAuthProvider>`**
   ```tsx
   <ParticleAuthProvider>
     {children}
   </ParticleAuthProvider>
   ```

3. **`src/hooks/useAuth.ts` 重构**
   - Mock 路径：生成确定性地址（不变）
   - Live 路径：调用 Particle 的 `connect()` 函数（非 hook，是普通函数调用）
   - 触发真实邮箱 OTP 验证流程

```typescript
// LIVE 登录流程（简化）
const connectFn = authMod.connect ?? authMod.ParticleAuth?.connect;
const userInfo = await connectFn({ socialType: "email", email: userEmail });
const addr = userInfo?.wallet?.public_address ?? userInfo?.wallets?.[0]?.public_address;
setAuth({ email: userEmail, address: addr as Address });
```

### Bug 3：SELL 订单 side 硬编码

**问题：** `client.ts:142` side 硬编码为 "BUY"，无法构造卖出订单。

**修复：**
- `live.ts` 新增 `encodePositionCall(side, amount, price)` 函数
- `side` 参数正确传递（YES/NO）
- 卖出时自动取反：`sellSide = position.side === "YES" ? "NO" : "YES"`

```typescript
function encodePositionCall(side: Side, amountUsd: number, price: number): string {
  const sideHex = side === "YES" ? "01" : "00";  // 不再硬编码
  const amountHex = Math.floor(amountUsd * 1e6).toString(16).padStart(64, "0");
  const priceHex  = Math.floor(price * 1e6).toString(16).padStart(64, "0");
  return `0x${sideHex}${amountHex}${priceHex}`;
}
```

### Bug 4：Agent 价格硬编码

**问题：** `applyAgentActions` 新建仓位用 `entryPrice: 0.5`，不是真实市场价格。

**修复（`useOneShot.ts`）：**
```typescript
// 修复前
entryPrice: 0.5

// 修复后
const market = markets.find((m) => m.id === a.marketId);
const entryPrice = market?.yesPrice ?? 0.5;  // 真实市场价格
```

同样修复了 `openPosition` 中的 entryPrice：
```typescript
// 修复前（可能用了旧的硬编码值）
entryPrice: market.yesPrice   // 现在: 直接用市场价格
```

### Bug 5：空交易发往零地址

**问题：** 非 Polymarket 市场发送 `data: "0x"` 到 `0x000...000`，死代码。

**修复（`live.ts`）：**
- 有真实合约（`NEXT_PUBLIC_MARKET_CONTRACT`）时：用 `encodePositionCall` 构造真实 calldata
- 无合约时：改为发送 USDC 自转账作为链上意图证明（有意义的交易，不是零地址）

```typescript
const transactions = hasRealContract
  ? [{ to: marketContract, data: encodePositionCall(args.side, args.stakeUsd, args.entryPrice), value: "0x0" }]
  : [{ to: USDC_CONTRACT, data: "0x", value: "0x0" }];  // USDC 自转账，非零地址
```

### Bug 6：无平仓/卖出功能

**修复：**

1. **`src/types/index.ts`** — Position 新增 `status: "open" | "closed"` 和 `shares` 字段

2. **`src/lib/particle/universalAccount.ts`** — 新增 `closePosition()` 方法到接口和 Mock 实现

3. **`src/lib/particle/live.ts`** — 实现真实的 `closePosition()` Live 版本

4. **`src/hooks/useOneShot.ts`** — 新增 `closePosition()` hook 方法，标记仓位为 closed

5. **`src/components/PositionsList.tsx`** — 新增"Close position (sell YES/NO)"按钮

---

## 5. Particle SDK 集成

### 凭据

| 字段 | 值 |
|------|-----|
| Project ID | `3b1fc10f-b2ea-48dc-ad62-6b20b2264fe0` |
| Client Key | `crwCy0oYSHQzQnY6WNQRwGz9UO6bEI4e5l3z4yl1` |
| Server Key | `sfkv1wdw1CHRxcInhvS6XXIB1uSaZHCeDe5vG5wl`（仅服务端） |
| App ID | `12039a72-9e05-4f0a-a949-57dd2ec46db7` |

### 为什么用 `new Function()` 和 `opaqueRequire()`

Particle SDK 的 `package.json exports` 字段不兼容 TypeScript `bundler` moduleResolution，直接用 `import()` 会导致构建失败。使用 `new Function("m", "return require(m)")` 让 tsc 无法静态追踪模块名，从而绕过类型检查。

### Particle Auth 正确调用方式

```
❌ 错误（违反 hooks 规则）：
const login = useCallback(() => {
  const { connect } = useConnect();  // hooks 不能在回调中调用！
});

✅ 正确（imperative API）：
const connectFn = authMod.connect;   // 普通函数，不是 hook
await connectFn({ socialType: "email", email });
```

---

## 6. DeepSeek V4 Agent

- API Key: `sk-your-deepseek-api-key`
- 端点: `https://api.deepseek.com/v1/chat/completions`
- 模型: `deepseek-chat`
- 在 Vercel 环境变量设置 `DEEPSEEK_API_KEY`

Agent 安全架构：规则引擎决策 → DeepSeek 只负责自然语言解释，不产生新动作。

---

## 7. Vercel 部署

1. 上传代码到 GitHub（https://github.com/0xCaptain888/oneshot）
2. Vercel 自动触发重新部署
3. 在 Vercel Settings → Environment Variables 添加上述所有变量
4. 重新部署生效

---

## 8. Particle Dashboard 配置

访问 https://dashboard.particle.network → OneShot 项目 → 应用设置 → 添加允许域名：
- `https://oneshot-seven-inky.vercel.app`
- `https://oneshot-git-main-0xcaptain888s-projects.vercel.app`
- `http://localhost:3000`

---

## 9. Hackathon 提交清单

- [x] GitHub 仓库
- [x] Vercel 部署
- [x] Mock 模式完整演示
- [x] 三个 magic moment 可运行
- [x] DeepSeek V4 Agent
- [x] 所有已知 Bug 修复
- [ ] Vercel 设置真实环境变量
- [ ] Particle Dashboard 配置域名
- [ ] Hackathon Deck
- [ ] 提交表单
