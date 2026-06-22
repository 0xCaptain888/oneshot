"use client";

import { useCallback, useRef } from "react";
import type { Market, Position, Side } from "@/types";
import { useStore } from "@/lib/store";
import {
  createUniversalAccount,
  type UniversalAccountService,
} from "@/lib/particle/universalAccount";
import { fakeTxHash } from "@/lib/utils";

export function useOneShot() {
  const address = useStore((s) => s.address);
  const setBalance = useStore((s) => s.setBalance);
  const setBalanceLoading = useStore((s) => s.setBalanceLoading);
  const addPosition = useStore((s) => s.addPosition);
  const updatePositions = useStore((s) => s.updatePositions);
  const openTx = useStore((s) => s.openTx);
  const setTxSteps = useStore((s) => s.setTxSteps);
  const finishTx = useStore((s) => s.finishTx);
  const agentPermission = useStore((s) => s.agentPermission);
  const setAgentRunning = useStore((s) => s.setAgentRunning);
  const setAgentResult = useStore((s) => s.setAgentResult);

  const svcRef = useRef<UniversalAccountService | null>(null);

  const getService = useCallback(async (): Promise<UniversalAccountService> => {
    if (!svcRef.current) {
      svcRef.current = await createUniversalAccount(address);
    }
    return svcRef.current;
  }, [address]);

  const refreshBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const svc = await getService();
      const bal = await svc.getUnifiedBalance();
      setBalance(bal);
    } finally {
      setBalanceLoading(false);
    }
  }, [getService, setBalance, setBalanceLoading]);

  /** Magic moment #1 — Universal Deposit */
  const fund = useCallback(async (amountUsd: number) => {
    openTx(`Funding $${amountUsd.toFixed(2)}`);
    const svc = await getService();
    const { txHash } = await svc.fundFromAnyChain(amountUsd, (steps) => setTxSteps(steps));
    finishTx(txHash);
    await refreshBalance();
    return txHash;
  }, [getService, openTx, setTxSteps, finishTx, refreshBalance]);

  /** Magic moment #2 — one-signature position (BUY YES or BUY NO) */
  const openPosition = useCallback(async (market: Market, side: Side, stakeUsd: number) => {
    openTx(`${side} · ${market.question}`);
    const svc = await getService();
    const pos = await svc.openPosition(
      {
        marketId: market.id,
        marketQuestion: market.question,
        side,
        stakeUsd,
        entryPrice: market.yesPrice,   // FIX: use real market price, not hardcoded 0.5
      },
      (steps) => setTxSteps(steps)
    );
    finishTx(pos.txHash ?? null);
    addPosition(pos);
    await refreshBalance();
    return pos;
  }, [getService, openTx, setTxSteps, finishTx, addPosition, refreshBalance]);

  /** FIX: Close/sell an existing position */
  const closePosition = useCallback(async (position: Position) => {
    openTx(`Closing ${position.side} · ${position.marketQuestion}`);
    const svc = await getService();
    const { txHash, proceedsUsd } = await svc.closePosition(position, (steps) => setTxSteps(steps));
    finishTx(txHash);
    // Mark position as closed
    updatePositions((prev) =>
      prev.map((p) =>
        p.id === position.id
          ? { ...p, status: "closed" as const, pnlUsd: proceedsUsd - position.stakeUsd }
          : p
      )
    );
    await refreshBalance();
    return { txHash, proceedsUsd };
  }, [getService, openTx, setTxSteps, finishTx, updatePositions, refreshBalance]);

  /** Magic moment #3 — scoped AI agent */
  const runAgent = useCallback(async (instruction?: string) => {
    setAgentRunning(true);
    try {
      const state = useStore.getState();
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: address,
          permission: agentPermission,
          positions: state.positions.filter((p) => p.status === "open"),
          markets: state.markets ?? [],
          unifiedBalance: state.unifiedBalance ?? { totalUsd: 0, breakdown: [] },
          instruction,
        }),
      });
      if (!res.ok) throw new Error(`Agent request failed: ${res.status}`);
      const data = await res.json();
      setAgentResult({ actions: data.actions, summary: data.summary, engine: data.engine });
      applyAgentActions(data.actions, updatePositions, state.markets ?? []);
      await refreshBalance();
      return data;
    } finally {
      setAgentRunning(false);
    }
  }, [address, agentPermission, setAgentRunning, setAgentResult, updatePositions, refreshBalance]);

  return { refreshBalance, fund, openPosition, closePosition, runAgent };
}

/**
 * Apply agent actions to local state.
 * FIX: agent-created positions now use the real market price, not 0.5.
 */
function applyAgentActions(
  actions: any[],
  updatePositions: (u: (prev: Position[]) => Position[]) => void,
  markets: Market[]
) {
  for (const a of actions) {
    if (a.kind === "settle" && a.marketId) {
      updatePositions((prev) =>
        prev.map((p) =>
          p.marketId === a.marketId && p.status === "open"
            ? { ...p, status: "closed" as const }
            : p
        )
      );
    } else if ((a.kind === "hedge" || a.kind === "rebalance") && a.marketId && a.side) {
      // FIX: use real market price, not hardcoded 0.5
      const market = markets.find((m) => m.id === a.marketId);
      const entryPrice = market?.yesPrice ?? 0.5;
      const currentPrice = a.side === "YES" ? entryPrice : 1 - entryPrice;

      updatePositions((prev) => [
        {
          id: `pos_${Math.random().toString(36).slice(2, 8)}`,
          marketId: a.marketId,
          marketQuestion: `[Agent ${a.kind}] ${market?.question ?? a.marketId}`,
          side: a.side as Side,
          stakeUsd: a.amountUsd ?? 0,
          entryPrice,
          currentPrice,
          pnlUsd: 0,
          openedAt: new Date().toISOString(),
          txHash: fakeTxHash(),
          status: "open" as const,
          shares: (a.amountUsd ?? 0) / Math.max(0.01, entryPrice),
        },
        ...prev,
      ]);
    }
  }
}
