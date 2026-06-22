"use client";

import { useState } from "react";
import { Bot, ShieldCheck, Sparkles, ExternalLink } from "lucide-react";
import { useStore } from "@/lib/store";
import { useOneShot } from "@/hooks/useOneShot";
import { Button, Badge } from "@/components/ui";
import { usd, shortAddress, explorerTxUrl } from "@/lib/utils";
import { config } from "@/config";
import { cn } from "@/lib/utils";

export function AgentPanel() {
  const permission = useStore((s) => s.agentPermission);
  const setPermission = useStore((s) => s.setAgentPermission);
  const running = useStore((s) => s.agentRunning);
  const actions = useStore((s) => s.agentActions);
  const summary = useStore((s) => s.agentSummary);
  const engine = useStore((s) => s.agentEngine);
  const connected = useStore((s) => s.connected);
  const { runAgent } = useOneShot();

  const [instruction, setInstruction] = useState("");

  function toggleActive() {
    setPermission({ active: !permission.active });
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-border bg-gradient-to-r from-accent-soft/60 to-transparent p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Agent autopilot</h2>
              <p className="text-xs text-muted">
                Scoped, time-boxed, revocable — it can never exceed your limits.
              </p>
            </div>
          </div>
          <button
            onClick={toggleActive}
            disabled={!connected}
            className={cn(
              "relative h-7 w-12 rounded-full border transition-colors disabled:opacity-50",
              permission.active
                ? "border-accent bg-accent"
                : "border-border bg-surface-2"
            )}
            aria-label="Toggle agent"
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                permission.active ? "translate-x-[22px]" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {/* Permission controls */}
        <div className="grid grid-cols-2 gap-3">
          <Control
            label="Max spend / run"
            value={`$${permission.maxSpendUsd}`}
          >
            <input
              type="range"
              min={5}
              max={config.agent.maxSpendUsd}
              step={5}
              value={permission.maxSpendUsd}
              onChange={(e) =>
                setPermission({ maxSpendUsd: Number(e.target.value) })
              }
              className="mt-2 w-full accent-accent"
            />
          </Control>
          <Control label="Max txns / run" value={`${permission.maxTxPerRun}`}>
            <input
              type="range"
              min={1}
              max={config.agent.maxTxPerRun}
              step={1}
              value={permission.maxTxPerRun}
              onChange={(e) =>
                setPermission({ maxTxPerRun: Number(e.target.value) })
              }
              className="mt-2 w-full accent-accent"
            />
          </Control>
        </div>

        <label className="flex items-center justify-between rounded-xl border border-border bg-surface-2/50 px-4 py-3">
          <span className="text-sm">Allow opening new positions</span>
          <input
            type="checkbox"
            checked={permission.canOpenPositions}
            onChange={(e) =>
              setPermission({ canOpenPositions: e.target.checked })
            }
            className="h-4 w-4 accent-accent"
          />
        </label>

        <div className="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent-soft/40 px-4 py-3 text-xs text-muted">
          <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
          <span>
            Enforced server-side by a session key. Caps are hard-limited; the
            agent signs nothing outside this scope.
          </span>
        </div>

        {/* Optional instruction */}
        <div>
          <input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Optional: tell the agent what to focus on…"
            className="h-11 w-full rounded-xl border border-border bg-surface-2 px-4 text-sm outline-none ring-accent/40 focus:ring-2"
          />
        </div>

        <Button
          onClick={() => runAgent(instruction || undefined)}
          loading={running}
          disabled={!permission.active || !connected}
          className="w-full"
        >
          <Sparkles className="h-4 w-4" />
          {permission.active ? "Run agent now" : "Enable the agent to run"}
        </Button>

        {/* Results */}
        {summary && (
          <div className="animate-fade-in space-y-3 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Agent report</span>
              <Badge tone={engine === "llm" ? "accent" : "neutral"}>
                {engine === "llm" ? "LLM-explained" : "rules engine"}
              </Badge>
            </div>
            <p className="text-sm text-muted">{summary}</p>

            <div className="space-y-2">
              {actions.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-border bg-surface-2/50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      tone={
                        a.kind === "settle"
                          ? "success"
                          : a.kind === "hedge"
                          ? "warn"
                          : a.kind === "rebalance"
                          ? "accent"
                          : "neutral"
                      }
                    >
                      {a.kind}
                    </Badge>
                    {a.amountUsd > 0 && (
                      <span className="text-xs text-muted">
                        {usd(a.amountUsd)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-muted">{a.rationale}</p>
                  {a.txHash && (
                    <a
                      href={explorerTxUrl(config.primaryChainId, a.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 font-mono text-xs text-accent hover:underline"
                    >
                      {shortAddress(a.txHash)} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Control({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-sm font-semibold">{value}</span>
      </div>
      {children}
    </div>
  );
}
