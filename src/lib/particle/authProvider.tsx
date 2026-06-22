"use client";

/**
 * Particle Auth Provider — v1.x compatible.
 *
 * SDK versions: @particle-network/auth-core-modal@1.5.2
 *               @particle-network/auth-core@1.5.2
 */

import React, { createContext, useContext } from "react";
import { IS_MOCK, config } from "@/config";
import { AuthCoreContextProvider } from "@particle-network/auth-core-modal";

/* ── Ready context ────────────────────────────────────────────────────────── */
interface ParticleReadyCtx { ready: boolean }
const Ctx = createContext<ParticleReadyCtx>({ ready: false });
export const useParticleReady = () => useContext(Ctx);

/* ── Arbitrum One (viem-compatible) ───────────────────────────────────────── */
export const ARBITRUM_ONE = {
  id: 42161,
  name: "Arbitrum One",
  network: "arbitrum",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://arb1.arbitrum.io/rpc"] },
    public:  { http: ["https://arb1.arbitrum.io/rpc"] },
  },
  blockExplorers: {
    default: { name: "Arbiscan", url: "https://arbiscan.io" },
  },
} as const;

/* ── Particle options for auth-core-modal v1.5.x ──────────────────────────── */
export const PARTICLE_OPTIONS = {
  projectId:  config.particle.projectId,
  clientKey:  config.particle.clientKey,
  appId:      config.particle.appId,
  chains: [ARBITRUM_ONE] as any[],
  themeType:  "dark" as const,
  fiatCoin:   "USD",
  language:   "en",
  promptSettingConfig: {
    promptMasterPasswordSettingWhenLogin: 0,
    promptPaymentPasswordSettingWhenSign: 0,
  },
};

/* ── LiveProvider ─────────────────────────────────────────────────────────── */
function LiveProvider({ children }: { children: React.ReactNode }) {
  return (
    <Ctx.Provider value={{ ready: true }}>
      <AuthCoreContextProvider options={PARTICLE_OPTIONS}>
        {children}
      </AuthCoreContextProvider>
    </Ctx.Provider>
  );
}

/* ── Public export ────────────────────────────────────────────────────────── */
export function ParticleAuthProvider({ children }: { children: React.ReactNode }) {
  if (IS_MOCK) {
    return <Ctx.Provider value={{ ready: true }}>{children}</Ctx.Provider>;
  }
  return <LiveProvider>{children}</LiveProvider>;
}
