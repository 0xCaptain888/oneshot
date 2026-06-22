"use client";

import { Check, ExternalLink, X, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui";
import { explorerTxUrl, shortAddress } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { TxStep } from "@/types";

export function TxModal() {
  const open = useStore((s) => s.txOpen);
  const title = useStore((s) => s.txTitle);
  const steps = useStore((s) => s.txSteps);
  const done = useStore((s) => s.txDone);
  const resultHash = useStore((s) => s.txResultHash);
  const close = useStore((s) => s.closeTx);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <div className="card w-full max-w-md animate-fade-in p-6">
        <div className="flex items-start justify-between">
          <h3 className="max-w-[80%] text-base font-semibold leading-snug">
            {title}
          </h3>
          {done && (
            <button
              onClick={close}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-5 space-y-1">
          {steps.map((step, i) => (
            <StepRow key={step.id} step={step} last={i === steps.length - 1} />
          ))}
        </div>

        {done && (
          <div className="mt-6 animate-fade-in">
            <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
              <Check className="h-4 w-4" />
              Done — chains handled it for you.
            </div>
            {resultHash && (
              <a
                href={explorerTxUrl(useStore.getState().txSteps.find((s) => s.txHash)?.chainId ?? 42161, resultHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm transition-colors hover:bg-surface-2/70"
              >
                <span className="font-mono text-muted">
                  {shortAddress(resultHash)}
                </span>
                <span className="flex items-center gap-1 text-accent">
                  View transaction <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </a>
            )}
            <Button onClick={close} className="mt-4 w-full" variant="ghost">
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepRow({ step, last }: { step: TxStep; last: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full border transition-colors",
            step.status === "done" && "border-success bg-success text-white",
            step.status === "active" && "border-accent bg-accent-soft text-accent",
            step.status === "pending" && "border-border bg-surface-2 text-muted",
            step.status === "error" && "border-danger bg-danger/10 text-danger"
          )}
        >
          {step.status === "done" ? (
            <Check className="h-4 w-4" />
          ) : step.status === "active" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
          )}
        </div>
        {!last && (
          <div
            className={cn(
              "my-1 w-px flex-1",
              step.status === "done" ? "bg-success/40" : "bg-border"
            )}
          />
        )}
      </div>
      <div className={cn("pb-3", last && "pb-0")}>
        <div
          className={cn(
            "text-sm",
            step.status === "pending" ? "text-muted" : "text-white"
          )}
        >
          {step.label}
        </div>
        {step.txHash && (
          <a
            href={explorerTxUrl(step.chainId ?? 42161, step.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-flex items-center gap-1 font-mono text-xs text-accent hover:underline"
          >
            {shortAddress(step.txHash)} <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
