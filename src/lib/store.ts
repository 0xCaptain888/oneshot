"use client";

import { create } from "zustand";
import type {
  Address,
  AgentAction,
  AgentPermission,
  Market,
  Position,
  TxStep,
  UnifiedBalance,
} from "@/types";
import { config } from "@/config";

interface AppState {
  connected: boolean;
  email: string | null;
  address: Address | null;

  unifiedBalance: UnifiedBalance | null;
  balanceLoading: boolean;

  markets: Market[];
  positions: Position[];

  txOpen: boolean;
  txTitle: string;
  txSteps: TxStep[];
  txDone: boolean;
  txResultHash: string | null;

  agentPermission: AgentPermission;
  agentRunning: boolean;
  agentActions: AgentAction[];
  agentSummary: string | null;
  agentEngine: "llm" | "rules" | null;

  setAuth: (v: { email: string | null; address: Address | null }) => void;
  disconnect: () => void;
  setBalance: (b: UnifiedBalance | null) => void;
  setBalanceLoading: (v: boolean) => void;
  setMarkets: (m: Market[]) => void;
  addPosition: (p: Position) => void;
  updatePositions: (updater: (prev: Position[]) => Position[]) => void;
  openTx: (title: string) => void;
  setTxSteps: (steps: TxStep[]) => void;
  finishTx: (hash: string | null) => void;
  closeTx: () => void;
  setAgentPermission: (p: Partial<AgentPermission>) => void;
  setAgentRunning: (v: boolean) => void;
  setAgentResult: (r: { actions: AgentAction[]; summary: string; engine: "llm" | "rules" }) => void;
}

function defaultPermission(): AgentPermission {
  return {
    maxSpendUsd: Math.min(50, config.agent.maxSpendUsd),
    maxTxPerRun: Math.min(3, config.agent.maxTxPerRun),
    canOpenPositions: true,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    active: false,
  };
}

export const useStore = create<AppState>((set) => ({
  connected: false,
  email: null,
  address: null,
  unifiedBalance: null,
  balanceLoading: false,
  markets: [],
  positions: [],
  txOpen: false,
  txTitle: "",
  txSteps: [],
  txDone: false,
  txResultHash: null,
  agentPermission: defaultPermission(),
  agentRunning: false,
  agentActions: [],
  agentSummary: null,
  agentEngine: null,

  setAuth: ({ email, address }) => set({ connected: !!address, email, address }),
  disconnect: () => set({
    connected: false, email: null, address: null,
    unifiedBalance: null, positions: [],
    agentActions: [], agentSummary: null,
    agentPermission: defaultPermission(),
  }),
  setBalance: (b) => set({ unifiedBalance: b }),
  setBalanceLoading: (v) => set({ balanceLoading: v }),
  setMarkets: (m) => set({ markets: m }),
  addPosition: (p) => set((s) => ({ positions: [p, ...s.positions] })),
  updatePositions: (updater) => set((s) => ({ positions: updater(s.positions) })),
  openTx: (title) => set({ txOpen: true, txTitle: title, txSteps: [], txDone: false, txResultHash: null }),
  setTxSteps: (steps) => set({ txSteps: steps }),
  finishTx: (hash) => set({ txDone: true, txResultHash: hash }),
  closeTx: () => set({ txOpen: false }),
  setAgentPermission: (p) => set((s) => ({ agentPermission: { ...s.agentPermission, ...p } })),
  setAgentRunning: (v) => set({ agentRunning: v }),
  setAgentResult: ({ actions, summary, engine }) =>
    set({ agentActions: actions, agentSummary: summary, agentEngine: engine }),
}));
