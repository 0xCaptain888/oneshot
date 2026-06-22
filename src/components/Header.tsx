"use client";

import { LogOut, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { shortAddress } from "@/lib/utils";
import { IS_MOCK, config } from "@/config";
import { Badge } from "@/components/ui";

export function Header() {
  const connected = useStore((s) => s.connected);
  const email = useStore((s) => s.email);
  const address = useStore((s) => s.address);
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <Zap className="h-5 w-5 text-white" fill="white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            {config.appName}
          </span>
          {IS_MOCK ? (
            <Badge tone="warn" className="ml-1">demo mode</Badge>
          ) : (
            <Badge tone="success" className="ml-1">live</Badge>
          )}
        </div>

        {connected && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium leading-tight">{email}</div>
              <div className="font-mono text-xs text-muted">
                {shortAddress(address)}
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-2 text-muted transition-colors hover:text-white"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
