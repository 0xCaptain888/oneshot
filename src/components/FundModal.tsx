"use client";

import { useState } from "react";
import { X, Wallet } from "lucide-react";
import { Button } from "@/components/ui";
import { useOneShot } from "@/hooks/useOneShot";

const PRESETS = [10, 25, 50, 100];

export function FundModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { fund } = useOneShot();
  const [amount, setAmount] = useState<number>(50);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleFund() {
    setSubmitting(true);
    try {
      onClose(); // close the picker; the TxModal takes over to show progress
      await fund(amount);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="card w-full max-w-md animate-fade-in p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Wallet className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">Fund your account</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 text-sm text-muted">
          We&apos;ll pull this from your funds on whatever chain you hold them —
          no bridge, no chain switching.
        </p>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setAmount(p)}
              className={
                "h-12 rounded-xl border text-sm font-medium transition-colors " +
                (amount === p
                  ? "border-accent bg-accent-soft text-white"
                  : "border-border bg-surface-2 text-muted hover:text-white")
              }
            >
              ${p}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <label className="text-sm font-medium">Custom amount</label>
          <div className="mt-1.5 flex h-12 items-center rounded-xl border border-border bg-surface-2 px-4">
            <span className="text-muted">$</span>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              className="w-full bg-transparent px-2 text-base outline-none"
            />
          </div>
        </div>

        <Button
          onClick={handleFund}
          loading={submitting}
          size="lg"
          className="mt-6 w-full"
          disabled={amount <= 0}
        >
          Fund ${amount.toFixed(2)}
        </Button>
      </div>
    </div>
  );
}
