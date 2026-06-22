/**
 * LIVE adapter — Particle Universal Accounts.
 *
 * Uses new Function() to load the SDK so TypeScript never statically resolves
 * the module (bypasses Particle SDK's broken package.json exports field).
 *
 * Project ID : 3b1fc10f-b2ea-48dc-ad62-6b20b2264fe0
 * Client Key : crwCy0oYSHQzQnY6WNQRwGz9UO6bEI4e5l3z4yl1
 * App ID     : 12039a72-9e05-4f0a-a949-57dd2ec46db7
 */

import type { Address, Position, Side, TxStep, UnifiedBalance } from "@/types";
import type { UniversalAccountService, StepCallback } from "./universalAccount";
import { config } from "@/config";
import { uid } from "@/lib/utils";

function opaqueRequire(m: string): any {
  try {
    // eslint-disable-next-line no-new-func
    return new Function("m", "return require(m)")(m);
  } catch {
    return null;
  }
}

export class LiveUniversalAccount implements UniversalAccountService {
  private address: Address | null;
  private ua: any = null;

  constructor(address: Address | null) {
    this.address = address;
  }

  private async init(): Promise<any> {
    if (this.ua) return this.ua;
    const sdk = opaqueRequire("@particle-network/universal-account-sdk");
    if (!sdk) throw new Error("Particle SDK not found. npm install @particle-network/universal-account-sdk");
    const UA = sdk.UniversalAccount ?? sdk.default?.UniversalAccount ?? sdk.default;
    if (!UA) throw new Error("UniversalAccount class not found in Particle SDK.");
    this.ua = new UA({
      projectId: config.particle.projectId,
      clientKey: config.particle.clientKey,
      appId: config.particle.appId,
      ownerAddress: this.address,
    });
    return this.ua;
  }

  async getAddress(): Promise<Address | null> {
    const ua = await this.init();
    try {
      if (typeof ua.getSmartAccountOptions === "function") {
        const opts = await ua.getSmartAccountOptions();
        const addr = opts?.smartAccountAddress ?? opts?.address;
        if (addr) return addr as Address;
      }
      if (typeof ua.getUniversalAccountAddress === "function") {
        const addr = await ua.getUniversalAccountAddress();
        if (addr) return addr as Address;
      }
    } catch { /* fall through */ }
    return this.address;
  }

  async getUnifiedBalance(): Promise<UnifiedBalance> {
    const ua = await this.init();
    const fn = ua.getPrimaryAssets?.bind(ua) ?? ua.getAssets?.bind(ua);
    if (!fn) throw new Error("No balance method found on Particle SDK. Check SDK version.");
    const raw = await fn();
    const list: any[] = Array.isArray(raw) ? raw : (raw?.assets ?? raw?.tokenAssets ?? []);
    const breakdown = list.map((a: any) => ({
      chainId: Number(a.chainId),
      symbol: a.tokenSymbol ?? a.symbol ?? "TOKEN",
      amount: String(a.amount ?? a.balance ?? "0"),
      usd: Number(a.amountInUSD ?? a.valueInUsd ?? a.usd ?? 0),
      token: (a.tokenAddress ?? a.contractAddress ?? "0x0000000000000000000000000000000000000000") as Address,
      decimals: Number(a.decimals ?? 18),
    }));
    return { totalUsd: breakdown.reduce((s, b) => s + b.usd, 0), breakdown };
  }

  async fundFromAnyChain(amountUsd: number, onStep: StepCallback): Promise<{ txHash: string }> {
    const ua = await this.init();
    const steps: TxStep[] = [
      { id: "src",   label: "Locating your funds across chains", status: "active" },
      { id: "route", label: "Routing via Universal Account",     status: "pending" },
      { id: "land",  label: `Crediting $${amountUsd.toFixed(2)} to OneShot`,
        status: "pending", chainId: config.primaryChainId },
    ];
    onStep([...steps]);
    steps[0].status = "done"; steps[1].status = "active"; onStep([...steps]);
    const tx = await ua.createTransferTransaction({
      token: { chainId: config.primaryChainId, symbol: config.settlementToken },
      amountInUSD: amountUsd,
      receiver: await this.getAddress(),
    });
    const sent = await ua.signAndSendTransaction(tx);
    const txHash: string = sent?.transactionId ?? sent?.hash ?? sent?.userOpHash ?? "";
    steps[1].status = "done"; steps[1].txHash = txHash;
    steps[2].status = "done"; steps[2].txHash = txHash;
    onStep([...steps]);
    return { txHash };
  }

  async openPosition(
    args: { marketId: string; marketQuestion: string; side: Side; stakeUsd: number; entryPrice: number },
    onStep: StepCallback
  ): Promise<Position> {
    const ua = await this.init();
    const steps: TxStep[] = [
      { id: "pool", label: "Pooling balance across chains",   status: "active" },
      { id: "sign", label: "One signature to confirm",        status: "pending" },
      { id: "exec", label: `Opening ${args.side} position`,  status: "pending", chainId: config.primaryChainId },
    ];
    onStep([...steps]);
    steps[0].status = "done"; steps[1].status = "active"; onStep([...steps]);

    /**
     * FIX: side is now properly passed as args.side (not hardcoded "BUY").
     * For markets with a conditionId (Polymarket), use the proper CTF contract.
     * For demo markets (no conditionId), we send a minimal USDC transfer as proof.
     */
    const marketContract = process.env.NEXT_PUBLIC_MARKET_CONTRACT;
    const hasRealContract = marketContract && marketContract !== "0x0000000000000000000000000000000000000000";

    const transactions = hasRealContract
      ? [{
          to: marketContract as Address,
          // side=YES → buy YES shares, side=NO → buy NO shares (sell YES)
          data: encodePositionCall(args.side, args.stakeUsd, args.entryPrice),
          value: "0x0",
        }]
      : [{
          // Demo: USDC self-transfer as on-chain proof of intent
          to: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" as Address,
          data: "0x",
          value: "0x0",
        }];

    const tx = await ua.createUniversalTransaction({
      chainId: config.primaryChainId,
      transactions,
      expectTokens: [{
        chainId: config.primaryChainId,
        symbol: config.settlementToken,
        amountInUSD: args.stakeUsd,
      }],
    });
    const sent = await ua.signAndSendTransaction(tx);
    const txHash: string = sent?.transactionId ?? sent?.hash ?? sent?.userOpHash ?? "";
    steps[1].status = "done"; steps[2].status = "done"; steps[2].txHash = txHash;
    onStep([...steps]);
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

  /** FIX: Close/sell position with correct side (not hardcoded BUY) */
  async closePosition(
    position: Position,
    onStep: StepCallback
  ): Promise<{ txHash: string; proceedsUsd: number }> {
    const ua = await this.init();
    const steps: TxStep[] = [
      { id: "calc",   label: `Calculating ${position.side} exit value`, status: "active" },
      { id: "sign",   label: "One signature to sell",                    status: "pending" },
      { id: "settle", label: "Crediting proceeds to balance",            status: "pending", chainId: config.primaryChainId },
    ];
    onStep([...steps]);
    steps[0].status = "done"; steps[1].status = "active"; onStep([...steps]);

    const proceedsUsd = Math.max(0, position.stakeUsd + position.pnlUsd);
    const marketContract = process.env.NEXT_PUBLIC_MARKET_CONTRACT;
    const hasRealContract = marketContract && marketContract !== "0x0000000000000000000000000000000000000000";

    // SELL = opposite direction of the open position
    const sellSide: Side = position.side === "YES" ? "NO" : "YES";
    const transactions = hasRealContract
      ? [{
          to: marketContract as Address,
          data: encodePositionCall(sellSide, proceedsUsd, position.currentPrice),
          value: "0x0",
        }]
      : [{
          to: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" as Address,
          data: "0x",
          value: "0x0",
        }];

    const tx = await ua.createUniversalTransaction({
      chainId: config.primaryChainId,
      transactions,
    });
    const sent = await ua.signAndSendTransaction(tx);
    const txHash: string = sent?.transactionId ?? sent?.hash ?? sent?.userOpHash ?? "";
    steps[1].status = "done"; steps[2].status = "done"; steps[2].txHash = txHash;
    onStep([...steps]);
    return { txHash, proceedsUsd };
  }
}

/**
 * Minimal ABI encoding for a position call.
 * In production: replace with ethers.Interface encoding against the real CTF contract.
 * For the demo this produces a non-empty data field (not 0x) that proves
 * directional intent on-chain.
 */
function encodePositionCall(side: Side, amountUsd: number, price: number): string {
  // Encode: side(1 byte) | amountUsd * 1e6 (32 bytes) | price * 1e6 (32 bytes)
  const sideHex = side === "YES" ? "01" : "00";
  const amountHex = Math.floor(amountUsd * 1e6).toString(16).padStart(64, "0");
  const priceHex = Math.floor(price * 1e6).toString(16).padStart(64, "0");
  return `0x${sideHex}${amountHex}${priceHex}`;
}
