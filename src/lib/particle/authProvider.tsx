"use client";

/**
 * Particle Auth Provider — v1.x compatible.
 *
 * SDK versions: @particle-network/auth-core-modal@1.5.2
 *               @particle-network/auth-core@1.5.2
 *
 * Three root causes fixed:
 * 1. chains was [] → now [ARBITRUM_ONE] (non-empty, correct viem shape)
 * 2. Used auth-core directly → now uses auth-core-modal's AuthCoreContextProvider
 * 3. Provider loaded in useEffect (too late) → synchronous module-level cache
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { IS_MOCK, config } from "@/config";

/* ── Ready context ────────────────────────────────────────────────────────── */
interface ParticleReadyCtx { ready: boolean }
const Ctx = createContext<ParticleReadyCtx>({ ready: false });
export const useParticleReady = () => useContext(Ctx);

/* ── Arbitrum One (viem-compatible) ─────────────────────────────────────────
 * FIX #1: chains MUST be [ViemChain, ...] — non-empty tuple
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

/* ── Particle options for auth-core-modal v1.5.x ────────────────────────────
 * Note: authTypes is NOT a valid option in v1.x — remove it.
 * v1.x uses 'customStyle' and other options instead.
 * ─────────────────────────────────────────────────────────────────────────── */
export const PARTICLE_OPTIONS = {
  projectId:  config.particle.projectId,   // 3b1fc10f-b2ea-48dc-ad62-6b20b2264fe0
  clientKey:  config.particle.clientKey,   // crwCy0oYSHQzQnY6WNQRwGz9UO6bEI4e5l3z4yl1
  appId:      config.particle.appId,       // 12039a72-9e05-4f0a-a949-57dd2ec46db7

  // FIX #1: non-empty chains array
  chains: [ARBITRUM_ONE] as any[],

  // v1.x theme options
  themeType:  "dark" as const,
  fiatCoin:   "USD",
  language:   "en",

  // Prompt for security settings after login
  promptSettingConfig: {
    promptMasterPasswordSettingWhenLogin: 0,   // 0=off for smoother demo UX
    promptPaymentPasswordSettingWhenSign: 0,
  },
};

/* ── Provider loader — synchronous module-level cache ────────────────────── */
// FIX #3: try to load synchronously so Provider is available on first render
let _cache: React.ComponentType<{ options: any; children: React.ReactNode }> | null | "pending" = "pending";

function tryLoadProvider(): React.ComponentType<{ options: any; children: React.ReactNode }> | null {
  if (_cache !== "pending") return _cache;
  try {
    // FIX #2: AuthCoreContextProvider from auth-core-modal (NOT auth-core)
    // eslint-disable-next-line no-new-func, @typescript-eslint/no-require-imports
    const mod = new Function("m", "return require(m)")("@particle-network/auth-core-modal");
    _cache = mod?.AuthCoreContextProvider ?? mod?.default?.AuthCoreContextProvider ?? null;
  } catch {
    _cache = null;
  }
  return _cache;
}

/* ── LiveProvider ─────────────────────────────────────────────────────────── */
function LiveProvider({ children }: { children: React.ReactNode }) {
  const [Provider, setProvider] = useState<React.ComponentType<{ options: any; children: React.ReactNode }> | null>(
    () => tryLoadProvider()   // synchronous on first render
  );
  const [ready, setReady] = useState(Provider !== null);

  useEffect(() => {
    if (Provider) { setReady(true); return; }
    // Fallback for environments where require wasn't available synchronously
    const p = tryLoadProvider();
    if (p) {
      setProvider(() => p);
      setReady(true);
    } else {
      console.warn(
        "[OneShot] @particle-network/auth-core-modal@1.5.2 not found. " +
        "Check your dependencies or use NEXT_PUBLIC_MOCK_MODE=true for demo mode."
      );
      setReady(true); // allow UI to render even without SDK
    }
  }, [Provider]);

  if (!Provider) {
    return <Ctx.Provider value={{ ready }}>{children}</Ctx.Provider>;
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
    return <Ctx.Provider value={{ ready: true }}>{children}</Ctx.Provider>;
  }
  return <LiveProvider>{children}</LiveProvider>;
}
