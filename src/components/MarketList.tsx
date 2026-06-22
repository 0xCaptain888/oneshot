"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import type { Market, Side } from "@/types";
import { useStore } from "@/lib/store";
import { useOneShot } from "@/hooks/useOneShot";
import { pct, usd } from "@/lib/utils";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export function MarketList() {
  const markets = useStore((s) => s.markets);

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold">Markets</h2>
      </div>
      <div className="space-y-3">
        {markets.map((m) => (
          <MarketRow key={m.id} market={m} />
        ))}
      </div>
    </div>
  );
}

function MarketRow({ market }: { market: Market }) {
  const { openPosition } = useOneShot();
  const connected = useStore((s) => s.connected);
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<Side>("YES");
  const [stake, setStake] = useState(20);
  const [busy, setBusy] = useState(false);

  async function place() {
    setBusy(true);
    try {
      setOpen(false);
      await openPosition(market, side, stake);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface-2/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-xl">
            {market.icon}
          </div>
          <div>
            <div className="font-medium leading-snug">{market.question}</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted">
              <span>{market.category}</span>
              <span>·</span>
              <span>{usd(market.volumeUsd)} vol</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-accent-2">
            {pct(market.yesPrice)}
          </div>
          <div className="text-xs text-muted">YES</div>
        </div>
      </div>

      {!open ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full"
          onClick={() => setOpen(true)}
          disabled={!connected}
        >
          Take a position
        </Button>
      ) : (
        <div className="mt-4 animate-fade-in space-y-3 border-t border-border pt-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSide("YES")}
              className={cn(
                "h-11 rounded-xl border text-sm font-semibold transition-colors",
                side === "YES"
                  ? "border-success bg-success/15 text-success"
                  : "border-border bg-surface text-muted hover:text-white"
              )}
            >
              YES · {pct(market.yesPrice)}
            </button>
            <button
              onClick={() => setSide("NO")}
              className={cn(
                "h-11 rounded-xl border text-sm font-semibold transition-colors",
                side === "NO"
                  ? "border-danger bg-danger/15 text-danger"
                  : "border-border bg-surface text-muted hover:text-white"
              )}
            >
              NO · {pct(1 - market.yesPrice)}
            </button>
          </div>

          <div className="flex h-11 items-center rounded-xl border border-border bg-surface px-4">
            <span className="text-sm text-muted">$</span>
            <input
              type="number"
              min={1}
              value={stake}
              onChange={(e) => setStake(Math.max(0, Number(e.target.value)))}
              className="w-full bg-transparent px-2 text-sm outline-none"
            />
            <span className="text-xs text-muted">stake</span>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-[2]"
              loading={busy}
              disabled={stake <= 0}
              onClick={place}
            >
              Confirm with one signature
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
