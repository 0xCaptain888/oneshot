"use client";

import { useState } from "react";
import { Receipt, ExternalLink, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useOneShot } from "@/hooks/useOneShot";
import { usd, pct, timeAgo, shortAddress, explorerTxUrl } from "@/lib/utils";
import { Badge, Button } from "@/components/ui";
import { config } from "@/config";

export function PositionsList() {
  const positions = useStore((s) => s.positions);
  // Show open positions first, then recently closed
  const open = positions.filter((p) => p.status === "open");
  const closed = positions.filter((p) => p.status === "closed");

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Receipt className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold">Your positions</h2>
        {open.length > 0 && (
          <Badge tone="neutral" className="ml-auto">
            {open.length} open
          </Badge>
        )}
      </div>

      {positions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
          <div className="text-sm text-muted">No positions yet.</div>
          <div className="mt-1 text-xs text-muted">
            Pick a market and take a position — it settles in one signature.
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {open.map((p) => (
            <PositionRow key={p.id} position={p} />
          ))}
          {closed.length > 0 && (
            <>
              <div className="pt-2 text-xs font-medium text-muted">Closed</div>
              {closed.slice(0, 3).map((p) => (
                <PositionRow key={p.id} position={p} readOnly />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PositionRow({
  position: p,
  readOnly = false,
}: {
  position: ReturnType<typeof useStore.getState>["positions"][number];
  readOnly?: boolean;
}) {
  const { closePosition } = useOneShot();
  const [closing, setClosing] = useState(false);

  async function handleClose() {
    setClosing(true);
    try {
      await closePosition(p);
    } finally {
      setClosing(false);
    }
  }

  const isClosed = p.status === "closed";

  return (
    <div
      className={
        "rounded-xl border border-border bg-surface-2/50 p-4 " +
        (isClosed ? "opacity-60" : "")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium leading-snug">
            {p.marketQuestion}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
            <Badge tone={p.side === "YES" ? "success" : "danger"}>
              {p.side}
            </Badge>
            <span>{usd(p.stakeUsd)} stake</span>
            <span>·</span>
            <span>entry {pct(p.entryPrice)}</span>
            <span>·</span>
            <span>{timeAgo(p.openedAt)}</span>
            {isClosed && <Badge tone="neutral">closed</Badge>}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <div
            className={
              "text-sm font-semibold " +
              (p.pnlUsd >= 0 ? "text-success" : "text-danger")
            }
          >
            {usd(p.pnlUsd, { sign: true })}
          </div>
          <div className="text-xs text-muted">now {pct(p.currentPrice)}</div>
        </div>
      </div>

      {p.txHash && (
        <a
          href={explorerTxUrl(config.primaryChainId, p.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 font-mono text-xs text-accent hover:underline"
        >
          {shortAddress(p.txHash)} <ExternalLink className="h-3 w-3" />
        </a>
      )}

      {/* FIX: Close / Sell button — only for open positions */}
      {!isClosed && !readOnly && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full border-danger/30 text-danger hover:bg-danger/10"
          loading={closing}
          onClick={handleClose}
        >
          <X className="h-3.5 w-3.5" />
          Close position (sell {p.side})
        </Button>
      )}
    </div>
  );
}
