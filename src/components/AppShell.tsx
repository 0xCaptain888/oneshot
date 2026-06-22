"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useOneShot } from "@/hooks/useOneShot";
import { SEED_MARKETS } from "@/lib/mockData";
import { Header } from "@/components/Header";
import { LoginScreen } from "@/components/LoginScreen";
import { BalanceCard } from "@/components/BalanceCard";
import { FundModal } from "@/components/FundModal";
import { TxModal } from "@/components/TxModal";
import { MarketList } from "@/components/MarketList";
import { PositionsList } from "@/components/PositionsList";
import { AgentPanel } from "@/components/AgentPanel";

export function AppShell() {
  const connected = useStore((s) => s.connected);
  const setMarkets = useStore((s) => s.setMarkets);
  const { refreshBalance } = useOneShot();
  const [fundOpen, setFundOpen] = useState(false);

  // Seed markets once.
  useEffect(() => {
    setMarkets(SEED_MARKETS);
  }, [setMarkets]);

  // When the user connects, load their unified balance.
  useEffect(() => {
    if (connected) {
      refreshBalance();
    }
  }, [connected, refreshBalance]);

  return (
    <>
      <Header />
      {!connected ? (
        <LoginScreen />
      ) : (
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column: balance + markets */}
            <div className="space-y-6 lg:col-span-2">
              <BalanceCard onFund={() => setFundOpen(true)} />
              <MarketList />
            </div>
            {/* Right column: positions + agent */}
            <div className="space-y-6">
              <PositionsList />
              <AgentPanel />
            </div>
          </div>
        </main>
      )}

      {/* Modals */}
      <FundModal open={fundOpen} onClose={() => setFundOpen(false)} />
      <TxModal />
    </>
  );
}
