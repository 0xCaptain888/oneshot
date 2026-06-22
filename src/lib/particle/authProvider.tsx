"use client";

/**
 * Particle Auth Provider — using @particle-network/authkit.
 *
 * SDK versions: @particle-network/authkit@2.1.1
 *               @particle-network/auth-core@1.5.2
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { IS_MOCK, config } from "@/config";
import { AuthCoreContextProvider } from "@particle-network/authkit";
import { ArbitrumOne } from "@particle-network/authkit/chains";

/* ── Ready context ────────────────────────────────────────────────────────── */
interface ParticleReadyCtx { ready: boolean }
const Ctx = createContext<ParticleReadyCtx>({ ready: false });
export const useParticleReady = () => useContext(Ctx);

/* ── Particle options for authkit v2.x ──────────────────────────────────── */
export const PARTICLE_OPTIONS = {
  projectId:  config.particle.projectId,   // 3b1fc10f-b2ea-48dc-ad62-6b20b2264fe0
  clientKey:  config.particle.clientKey,   // crwCy0oYSHQzQnY6WNQRwGz9UO6bEI4e5l3z4yl1
  appId:      config.particle.appId,       // 12039a72-9e05-4f0a-a949-57dd2ec46db7

  // Chains
  chains: [ArbitrumOne] as any[],

  // v2.x theme options
  themeType:  "dark" as const,
  fiatCoin:   "USD",
  language:   "en",

  // Prompt for security settings after login
  promptSettingConfig: {
    promptMasterPasswordSettingWhenLogin: 0,   // 0=off for smoother demo UX
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
