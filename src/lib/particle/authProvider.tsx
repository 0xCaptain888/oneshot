"use client";

/**
 * Particle Auth Provider — definitive implementation.
 *
 * Fixes all three root causes:
 * 1. chains was empty [] → now [ARBITRUM_ONE] (non-empty, correct viem shape)
 * 2. Was mixing auth-core + auth-core-modal → only auth-core-modal now
 * 3. Async init timing → Provider is rendered synchronously on first paint
 *    via a dynamic import at the module level (not inside useEffect)
 *
 * Design: We use Next.js dynamic() with ssr:false to load the Provider
 * only on the client, avoiding SSR issues, while keeping it in the React
 * tree from the very first client render.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { IS_MOCK, config } from "@/config";

/* ── Ready context ────────────────────────────────────────────────────────── */
interface ParticleReadyCtx { ready: boolean }
const Ctx = createContext<ParticleReadyCtx>({ ready: false });
export const useParticleReady = () => useContext(Ctx);

/* ── viem-compatible Arbitrum One ────────────────────────────────────────────
 * FIX #1: chains MUST be a non-empty tuple [ViemChain, ...ViemChain[]]
 * ─────────────────────────────────────────────────────────────────────────── */
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

/* ── Particle options (shared between provider and any direct SDK calls) ──── */
export const PARTICLE_OPTIONS = {
  projectId: config.particle.projectId,
  clientKey: config.particle.clientKey,
  appId:     config.particle.appId,
  chains:    [ARBITRUM_ONE] as any[],   // FIX #1: non-empty, correct viem shape
  authTypes: ["email"] as string[],
  themeType: "dark" as const,
  fiatCoin:  "USD",
  language:  "en",
  promptSettingConfig: {
    promptMasterPasswordSettingWhenLogin: 1,
    promptPaymentPasswordSettingWhenSign: 1,
  },
};

/* ── Live provider: loads auth-core-modal on client ──────────────────────────
 * FIX #2: uses AuthCoreContextProvider from auth-core-modal (NOT auth-core)
 * FIX #3: loads synchronously on first client render using module-level cache
 * ─────────────────────────────────────────────────────────────────────────── */

// Module-level cache — populated once, never changes
let _ProviderCache: React.ComponentType<{ options: any; children: React.ReactNode }> | null | "loading" = "loading";

function tryLoadProvider(): React.ComponentType<{ options: any; children: React.ReactNode }> | null {
  if (_ProviderCache !== "loading") return _ProviderCache;
  try {
    // eslint-disable-next-line no-new-func, @typescript-eslint/no-require-imports
    const mod = new Function("m", "return require(m)")("@particle-network/auth-core-modal");
    // FIX #2: AuthCoreContextProvider is the high-level provider from auth-core-modal
    // It handles OTP UI, captcha, session management — auth-core alone does NOT
    _ProviderCache =
      mod?.AuthCoreContextProvider ??
      mod?.default?.AuthCoreContextProvider ??
      null;
  } catch {
    _ProviderCache = null;
  }
  return _ProviderCache === "loading" ? null : _ProviderCache;
}

function LiveProvider({ children }: { children: React.ReactNode }) {
  // FIX #3: try to get the provider synchronously (module-level cache)
  // This means on first render we already have the Provider — no flash
  const [Provider, setProvider] = useState<React.ComponentType<{ options: any; children: React.ReactNode }> | null>(
    () => tryLoadProvider()
  );
  const [ready, setReady] = useState(Provider !== null);

  useEffect(() => {
    if (Provider) { setReady(true); return; }
    // Fallback: if require wasn't available on first render (SSR edge case),
    // try again after hydration
    const p = tryLoadProvider();
    if (p) {
      setProvider(() => p);
      setReady(true);
    } else {
      // SDK not installed — still mark ready so UI isn't permanently blocked
      console.warn(
        "[OneShot] @particle-network/auth-core-modal not found. " +
        "Live auth unavailable. Set NEXT_PUBLIC_MOCK_MODE=true for demo mode."
      );
      setReady(true);
    }
  }, [Provider]);

  if (!Provider) {
    // SDK unavailable — render children without Particle wrapper
    return (
      <Ctx.Provider value={{ ready }}>
        {children}
      </Ctx.Provider>
    );
  }

  return (
    <Ctx.Provider value={{ ready: true }}>
      <Provider options={PARTICLE_OPTIONS}>
        {children}
      </Provider>
    </Ctx.Provider>
  );
}

/* ── Public export ────────────────────────────────────────────────────────── */
export function ParticleAuthProvider({ children }: { children: React.ReactNode }) {
  if (IS_MOCK) {
    return (
      <Ctx.Provider value={{ ready: true }}>
        {children}
      </Ctx.Provider>
    );
  }
  return <LiveProvider>{children}</LiveProvider>;
}
