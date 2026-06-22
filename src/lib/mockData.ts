import type { Market, TokenBalance, UnifiedBalance } from "@/types";

export const SEED_MARKETS: Market[] = [
  {
    id: "mkt_btc_200k",
    question: "Will BTC close above $200k in 2026?",
    category: "Crypto",
    yesPrice: 0.42,
    closesAt: "2026-12-31T23:59:59Z",
    volumeUsd: 4_820_000,
    icon: "₿",
  },
  {
    id: "mkt_eth_flip",
    question: "Will ETH/BTC reclaim 0.06 before Q4?",
    category: "Crypto",
    yesPrice: 0.31,
    closesAt: "2026-09-30T23:59:59Z",
    volumeUsd: 1_240_000,
    icon: "Ξ",
  },
  {
    id: "mkt_fed_cut",
    question: "Will the Fed cut rates at the next meeting?",
    category: "Macro",
    yesPrice: 0.66,
    closesAt: "2026-07-29T23:59:59Z",
    volumeUsd: 9_510_000,
    icon: "🏦",
  },
  {
    id: "mkt_ai_agent",
    question: "Will on-chain AI agents exceed 1M DAU in 2026?",
    category: "AI",
    yesPrice: 0.58,
    closesAt: "2026-12-31T23:59:59Z",
    volumeUsd: 760_000,
    icon: "🤖",
  },
];

export const SEED_BREAKDOWN: TokenBalance[] = [
  { chainId: 8453, symbol: "USDC", amount: "38.00", usd: 38.0, token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
  { chainId: 1,    symbol: "USDC", amount: "14.20", usd: 14.2, token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
  { chainId: 137,  symbol: "USDT", amount: "9.80",  usd: 9.8,  token: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6 },
  { chainId: 10,   symbol: "ETH",  amount: "0.0042", usd: 12.4, token: "0x0000000000000000000000000000000000000000", decimals: 18 },
];

export function seedUnifiedBalance(): UnifiedBalance {
  return {
    totalUsd: SEED_BREAKDOWN.reduce((s, b) => s + b.usd, 0),
    breakdown: SEED_BREAKDOWN,
  };
}
