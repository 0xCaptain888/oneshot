"use client";

import { useState } from "react";
import { ArrowRight, Layers, MousePointerClick, Bot } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui";
import { IS_MOCK } from "@/config";

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email || !email.includes("@")) {
      setError("Enter a valid email to continue.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email.trim());
    } catch (e: any) {
      setError(e?.message ?? "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-center justify-center px-4 py-12">
      <div className="grid w-full items-center gap-12 lg:grid-cols-2">
        {/* Left: hero copy */}
        <div className="animate-fade-in">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
            Powered by Universal Accounts + EIP-7702
          </div>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            Bet on anything.
            <br />
            <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
              Chains stay invisible.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted">
            Fund from any chain in one click. Take a position with one signature.
            Hand it to an agent. No bridges, no gas tokens, no chain switching —
            ever.
          </p>

          <ul className="mt-8 space-y-3">
            <Feature
              icon={<Layers className="h-5 w-5" />}
              title="Fund from any chain"
              body="Your USDC on Base, ETH on Optimism — pooled into one balance."
            />
            <Feature
              icon={<MousePointerClick className="h-5 w-5" />}
              title="One signature"
              body="Open a position drawing liquidity across chains in a single tap."
            />
            <Feature
              icon={<Bot className="h-5 w-5" />}
              title="Scoped AI agent"
              body="Cap it, time-box it, revoke it. It manages positions for you."
            />
          </ul>
        </div>

        {/* Right: login card */}
        <div className="card animate-fade-in p-8">
          <h2 className="text-xl font-semibold">Get started</h2>
          <p className="mt-1 text-sm text-muted">
            No wallet, no seed phrase. Just your email.
          </p>

          <label className="mt-6 block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="you@example.com"
            className="mt-2 h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-base outline-none ring-accent/40 transition focus:ring-2"
          />

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}

          <Button
            onClick={handleLogin}
            loading={loading}
            size="lg"
            className="mt-5 w-full"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="mt-4 text-center text-xs text-muted">
            {IS_MOCK
              ? "Demo mode: any email works and all chain ops are simulated."
              : "We create a self-custodial Universal Account for you instantly."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 text-accent">
        {icon}
      </div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted">{body}</div>
      </div>
    </li>
  );
}
