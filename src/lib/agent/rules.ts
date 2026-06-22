/**
 * Deterministic agent rules engine (server-side, guardrailed).
 *
 * Actions come from explicit rules — never from an LLM. The LLM (DeepSeek V4)
 * only rephrases the plan in natural language.
 *
 * Three safety layers:
 * 1. User-set permission (UI sliders)
 * 2. Server hard caps (env: AGENT_MAX_SPEND_USD / AGENT_MAX_TX_PER_RUN)
 * 3. This engine: deterministic, auditable
 */

import type { AgentAction, AgentPermission, Market, Position, UnifiedBalance } from "@/types";

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export interface ServerCaps {
  maxSpendUsd: number;
  maxTxPerRun: number;
}

export interface RulesInput {
  permission: AgentPermission;
  positions: Position[];
  markets: Market[];
  unifiedBalance: UnifiedBalance;
  caps: ServerCaps;
}

function effectiveBudget(permission: AgentPermission, caps: ServerCaps) {
  return {
    spend: Math.min(permission.maxSpendUsd, caps.maxSpendUsd),
    tx: Math.min(permission.maxTxPerRun, caps.maxTxPerRun),
  };
}

export function decideActions(input: RulesInput): AgentAction[] {
  const { permission, positions, markets, unifiedBalance } = input;
  if (!permission.active) return [noopAction()];

  const budget = effectiveBudget(permission, input.caps);
  const actions: AgentAction[] = [];
  let spent = 0;

  // Only consider OPEN positions
  const openPositions = positions.filter((p) => p.status === "open");

  const canSpend = (amt: number) =>
    actions.length < budget.tx && spent + amt <= budget.spend;

  // 1) SETTLE: position strongly in favour (≥ 85% probability on held side)
  for (const p of openPositions) {
    const favor = p.side === "YES" ? p.currentPrice : 1 - p.currentPrice;
    if (favor >= 0.85 && canSpend(0)) {
      actions.push({
        id: uid("act"),
        kind: "settle",
        rationale: `Position on "${truncate(p.marketQuestion)}" is ${Math.round(favor * 100)}% in favour — locking in the gain.`,
        amountUsd: 0,
        marketId: p.marketId,
        side: p.side,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      if (actions.length >= budget.tx) return actions;
    }
  }

  // 2) HEDGE: position strongly against (≤ 20% probability on held side)
  if (permission.canOpenPositions) {
    for (const p of openPositions) {
      const favor = p.side === "YES" ? p.currentPrice : 1 - p.currentPrice;
      if (favor <= 0.20) {
        const hedge = Math.min(p.stakeUsd * 0.5, budget.spend - spent);
        if (hedge >= 1 && canSpend(hedge)) {
          spent += hedge;
          const hedgeSide = p.side === "YES" ? "NO" : "YES";
          actions.push({
            id: uid("act"),
            kind: "hedge",
            rationale: `Position on "${truncate(p.marketQuestion)}" is underwater — opening a $${hedge.toFixed(2)} ${hedgeSide} hedge to cap downside.`,
            amountUsd: hedge,
            marketId: p.marketId,
            side: hedgeSide,
            status: "pending",
            createdAt: new Date().toISOString(),
          });
          if (actions.length >= budget.tx) return actions;
        }
      }
    }
  }

  // 3) REBALANCE: deploy idle cash into highest-volume market
  if (permission.canOpenPositions && markets.length > 0) {
    const exposure = openPositions.reduce((s, p) => s + p.stakeUsd, 0);
    const idle = unifiedBalance.totalUsd;
    if (idle > exposure && idle > 5) {
      const deploy = Math.min(idle * 0.10, budget.spend - spent, 10);
      if (deploy >= 1 && canSpend(deploy)) {
        const target = [...markets].sort((a, b) => b.volumeUsd - a.volumeUsd)[0];
        // FIX: use real market price for side selection
        const side = target.yesPrice >= 0.5 ? "YES" : "NO";
        spent += deploy;
        actions.push({
          id: uid("act"),
          kind: "rebalance",
          rationale: `Idle balance is higher than exposure — deploying $${deploy.toFixed(2)} into "${truncate(target.question)}" (${side} at ${Math.round(target.yesPrice * 100)}%).`,
          amountUsd: deploy,
          marketId: target.id,
          side,
          status: "pending",
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  if (actions.length === 0) return [noopAction()];
  return actions;
}

function noopAction(): AgentAction {
  return {
    id: uid("act"),
    kind: "noop",
    rationale: "Everything looks balanced — no winners to settle, no positions underwater, and exposure is reasonable. The agent will keep watching.",
    amountUsd: 0,
    status: "done",
    createdAt: new Date().toISOString(),
  };
}

export function rulesSummary(actions: AgentAction[]): string {
  const real = actions.filter((a) => a.kind !== "noop");
  if (real.length === 0) return "No action needed. Your positions are balanced and the agent is monitoring.";
  const verbs: Record<string, string> = { settle: "settle", hedge: "hedge", rebalance: "rebalance", noop: "hold" };
  const parts = real.map((a) => `${verbs[a.kind]} ($${a.amountUsd.toFixed(2)})`);
  return `Agent planned ${real.length} action${real.length > 1 ? "s" : ""}: ${parts.join(", ")}. All within your scoped limits.`;
}

function truncate(s: string, n = 48): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
