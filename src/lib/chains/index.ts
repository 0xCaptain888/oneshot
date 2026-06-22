import type { ChainInfo } from "@/types";

/**
 * Chains OneShot understands. The user never picks one of these — the app
 * pools balances across all of them via Universal Accounts. They appear only
 * in the "under the hood" panel to prove the abstraction is real.
 */
export const CHAINS: Record<number, ChainInfo> = {
  1: {
    id: 1,
    name: "Ethereum",
    shortName: "ETH",
    color: "#627EEA",
    explorer: "https://etherscan.io",
    nativeSymbol: "ETH",
    testnet: false,
  },
  42161: {
    id: 42161,
    name: "Arbitrum One",
    shortName: "ARB",
    color: "#28A0F0",
    explorer: "https://arbiscan.io",
    nativeSymbol: "ETH",
    testnet: false,
  },
  8453: {
    id: 8453,
    name: "Base",
    shortName: "BASE",
    color: "#0052FF",
    explorer: "https://basescan.org",
    nativeSymbol: "ETH",
    testnet: false,
  },
  137: {
    id: 137,
    name: "Polygon",
    shortName: "POL",
    color: "#8247E5",
    explorer: "https://polygonscan.com",
    nativeSymbol: "POL",
    testnet: false,
  },
  10: {
    id: 10,
    name: "Optimism",
    shortName: "OP",
    color: "#FF0420",
    explorer: "https://optimistic.etherscan.io",
    nativeSymbol: "ETH",
    testnet: false,
  },
  56: {
    id: 56,
    name: "BNB Chain",
    shortName: "BNB",
    color: "#F0B90B",
    explorer: "https://bscscan.com",
    nativeSymbol: "BNB",
    testnet: false,
  },
};

export const ALL_CHAIN_IDS = Object.keys(CHAINS).map(Number);

export function getChain(id: number): ChainInfo | undefined {
  return CHAINS[id];
}

export function explorerTxUrl(chainId: number, txHash: string): string {
  const chain = CHAINS[chainId];
  if (!chain) return "#";
  return `${chain.explorer}/tx/${txHash}`;
}
