"use client";

import { useState } from "react";
import { ChevronDown, Plus, Eye, EyeOff } from "lucide-react";
import { useStore } from "@/lib/store";
import { usd } from "@/lib/utils";
import { ChainChip, Button, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

export function BalanceCard({ onFund }: { onFund: () => void }) {
  const balance = useStore((s) => s.unifiedBalance);
  const loading = useStore((s) => s.balanceLoading);
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <div className="card overflow-hidden p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-muted">Your balance</div>
          {loading && !balance ? (
            <Skeleton className="mt-2 h-10 w-40" />
          ) : (
            <div className="mt-1 text-4xl font-bold tracking-tight">
              {usd(balance?.totalUsd ?? 0)}
            </div>
          )}
          <div className="mt-1 text-xs text-muted">
            One balance · {balance?.breakdown.length ?? 0} chains underneath
          </div>
        </div>
        <Button onClick={onFund} size="md">
          <Plus className="h-4 w-4" /> Fund
        </Button>
      </div>

      {/* Under the hood toggle — this is the proof that abstraction is real. */}
      <button
        onClick={() => setShowBreakdown((v) => !v)}
        className="mt-5 flex w-full items-center justify-between rounded-xl border border-border bg-surface-2/60 px-4 py-3 text-sm transition-colors hover:bg-surface-2"
      >
        <span className="flex items-center gap-2 text-muted">
          {showBreakdown ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          Under the hood
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted transition-transform",
            showBreakdown && "rotate-180"
          )}
        />
      </button>

      {showBreakdown && (
        <div className="mt-3 animate-fade-in space-y-2">
          <p className="text-xs text-muted">
            Your money actually lives across these chains. OneShot pools it via a
            Universal Account — you never bridge or switch.
          </p>
          {(balance?.breakdown ?? []).map((b, i) => (
            <div
              key={`${b.chainId}-${b.symbol}-${i}`}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <ChainChip chainId={b.chainId} />
                <span className="text-sm">
                  {b.amount} {b.symbol}
                </span>
              </div>
              <span className="text-sm text-muted">{usd(b.usd)}</span>
            </div>
          ))}
          {(balance?.breakdown.length ?? 0) === 0 && (
            <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted">
              No balances yet. Hit “Fund” to bring money in from any chain.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
