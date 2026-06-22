// Core domain types for OneShot.

export type Address = `0x${string}`;

export interface ChainInfo {
  id: number;
  name: string;
  shortName: string;
  color: string;
  explorer: string;
  nativeSymbol: string;
  testnet: boolean;
}

export interface TokenBalance {
  chainId: number;
  symbol: string;
  amount: string;
  usd: number;
  token: Address;
  decimals: number;
}

export interface UnifiedBalance {
  totalUsd: number;
  breakdown: TokenBalance[];
}

export type Side = "YES" | "NO";

export interface Market {
  id: string;
  question: string;
  category: string;
  yesPrice: number;
  closesAt: string;
  volumeUsd: number;
  icon: string;
  /** Polymarket condition ID (optional — present for real markets) */
  conditionId?: string;
}

export interface Position {
  id: string;
  marketId: string;
  marketQuestion: string;
  side: Side;
  stakeUsd: number;
  entryPrice: number;
  currentPrice: number;
  pnlUsd: number;
  openedAt: string;
  txHash?: string;
  /** Whether this position is still open */
  status: "open" | "closed";
  /** Shares held (for sell/close calculation) */
  shares?: number;
}

export type TxStepStatus = "pending" | "active" | "done" | "error";

export interface TxStep {
  id: string;
  label: string;
  status: TxStepStatus;
  txHash?: string;
  chainId?: number;
}

export interface AgentPermission {
  maxSpendUsd: number;
  maxTxPerRun: number;
  canOpenPositions: boolean;
  expiresAt: string;
  active: boolean;
}

export interface AgentAction {
  id: string;
  kind: "rebalance" | "settle" | "hedge" | "noop";
  rationale: string;
  amountUsd: number;
  marketId?: string;
  side?: Side;
  txHash?: string;
  status: TxStepStatus;
  createdAt: string;
}

export interface AgentRunRequest {
  account: Address | null;
  permission: AgentPermission;
  positions: Position[];
  markets: Market[];
  unifiedBalance: UnifiedBalance;
  instruction?: string;
}

export interface AgentRunResponse {
  summary: string;
  actions: AgentAction[];
  engine: "llm" | "rules";
}

/** Auth state passed from ParticleProvider to the rest of the app */
export interface AuthState {
  address: Address | null;
  email: string | null;
  connected: boolean;
}
