/**
 * Universal Account service — interface + Mock + factory.
 *
 * The interface has four methods covering the three "magic moments":
 *   1. getUnifiedBalance()  — one balance, all chains
 *   2. fundFromAnyChain()   — Universal Deposit (magic moment #1)
 *   3. openPosition()       — one-signature cross-chain trade (moment #2)
 *   4. closePosition()      — sell/close an open position (fixes BUY-only bug)
 */

import type { Address, Position, Side, TxStep, UnifiedBalance } from "@/types";
import { IS_MOCK, config } from "@/config";
import { fakeTxHash, sleep, uid } from "@/lib/utils";
import { seedUnifiedBalance } from "@/lib/mockData";

export type StepCallback = (steps: TxStep[]) => void;

export interface UniversalAccountService {
  getAddress(): Promise<Address | null>;
  getUnifiedBalance(): Promise<UnifiedBalance>;
  fundFromAnyChain(amountUsd: number, onStep: StepCallback): Promise<{ txHash: string }>;
  openPosition(
    args: { marketId: string; marketQuestion: string; side: Side; stakeUsd: number; entryPrice: number },
    onStep: StepCallback
  ): Promise<Position>;
  /** FIX: close/sell an existing position */
  closePosition(
    position: Position,
    onStep: StepCallback
  ): Promise<{ txHash: string; proceedsUsd: number }>;
}

/* ── MOCK ─────────────────────────────────────────────────────────────────── */

class MockUniversalAccount implements UniversalAccountService {
  private address: Address | null;
  private balance: UnifiedBalance;

  constructor(address: Address | null) {
    this.address = address;
    this.balance = seedUnifiedBalance();
  }

  async getAddress(): Promise<Address | null> { return this.address; }

  async getUnifiedBalance(): Promise<UnifiedBalance> {
    await sleep(300);
    return { ...this.balance, breakdown: [...this.balance.breakdown] };
  }

  async fundFromAnyChain(amountUsd: number, onStep: StepCallback): Promise<{ txHash: string }> {
    const steps: TxStep[] = [
      { id: "src",   label: "Locating your funds across chains", status: "active" },
      { id: "route", label: "Routing via Universal Account",     status: "pending" },
      { id: "land",  label: `Crediting $${amountUsd.toFixed(2)} to OneShot`,
        status: "pending", chainId: config.primaryChainId },
    ];
    onStep([...steps]);
    await sleep(900);
    steps[0].status = "done"; steps[1].status = "active"; onStep([...steps]);
    await sleep(1100);
    const txHash = fakeTxHash();
    steps[1].status = "done"; steps[1].txHash = txHash; steps[2].status = "active"; onStep([...steps]);
    await sleep(800);
    steps[2].status = "done"; steps[2].txHash = txHash; onStep([...steps]);
    this.balance = { ...this.balance, totalUsd: this.balance.totalUsd + amountUsd };
    return { txHash };
  }

  async openPosition(
    args: { marketId: string; marketQuestion: string; side: Side; stakeUsd: number; entryPrice: number },
    onStep: StepCallback
  ): Promise<Position> {
    const steps: TxStep[] = [
      { id: "pool", label: "Pooling balance across chains", status: "active" },
      { id: "sign", label: "One signature to confirm",      status: "pending" },
      { id: "exec", label: `Opening ${args.side} position`, status: "pending", chainId: config.primaryChainId },
    ];
    onStep([...steps]);
    await sleep(800);
    steps[0].status = "done"; steps[1].status = "active"; onStep([...steps]);
    await sleep(700);
    const txHash = fakeTxHash();
    steps[1].status = "done"; steps[2].status = "active"; steps[2].txHash = txHash; onStep([...steps]);
    await sleep(900);
    steps[2].status = "done"; onStep([...steps]);
    this.balance = { ...this.balance, totalUsd: Math.max(0, this.balance.totalUsd - args.stakeUsd) };
    return {
      id: uid("pos"),
      marketId: args.marketId,
      marketQuestion: args.marketQuestion,
      side: args.side,
      stakeUsd: args.stakeUsd,
      entryPrice: args.entryPrice,
      currentPrice: args.entryPrice,
      pnlUsd: 0,
      openedAt: new Date().toISOString(),
      txHash,
      status: "open",
      shares: args.stakeUsd / Math.max(0.01, args.entryPrice),
    };
  }

  /** FIX: close/sell position — returns current value, not just BUY */
  async closePosition(
    position: Position,
    onStep: StepCallback
  ): Promise<{ txHash: string; proceedsUsd: number }> {
    const steps: TxStep[] = [
      { id: "calc",  label: `Calculating ${position.side} exit value`, status: "active" },
      { id: "sign",  label: "One signature to sell",                    status: "pending" },
      { id: "settle",label: "Crediting proceeds to balance",            status: "pending", chainId: config.primaryChainId },
    ];
    onStep([...steps]);
    await sleep(700);
    steps[0].status = "done"; steps[1].status = "active"; onStep([...steps]);
    await sleep(800);
    const txHash = fakeTxHash();
    steps[1].status = "done"; steps[2].status = "active"; steps[2].txHash = txHash; onStep([...steps]);
    await sleep(600);
    steps[2].status = "done"; onStep([...steps]);
    // Proceeds = stake + unrealised PnL
    const proceedsUsd = Math.max(0, position.stakeUsd + position.pnlUsd);
    this.balance = { ...this.balance, totalUsd: this.balance.totalUsd + proceedsUsd };
    return { txHash, proceedsUsd };
  }
}

/* ── FACTORY ─────────────────────────────────────────────────────────────── */

export async function createUniversalAccount(
  address: Address | null
): Promise<UniversalAccountService> {
  if (IS_MOCK) return new MockUniversalAccount(address);
  const { LiveUniversalAccount } = await import("@/lib/particle/live");
  return new LiveUniversalAccount(address);
}
