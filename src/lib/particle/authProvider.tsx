"use client";

/**
 * Particle Auth Provider — initializes the SDK with chains before rendering.
 *
 * The AuthCoreContextProvider doesn't pass chains to the internal particleAuth.init(),
 * so we need to initialize it manually first.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { IS_MOCK, config } from "@/config";

/* ── Ready context ────────────────────────────────────────────────────────── */
interface ParticleReadyCtx { ready: boolean }
const Ctx = createContext<ParticleReadyCtx>({ ready: false });
export const useParticleReady = () => useContext(Ctx);

/* ── viem-compatible Arbitrum One ──────────────────────────────────────────── */
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

/* ── Particle options for AuthCoreContextProvider ──────────────────────────── */
export const PARTICLE_OPTIONS = {
  projectId: config.particle.projectId,
  clientKey: config.particle.clientKey,
  appId:     config.particle.appId,
  authTypes: ["email"] as string[],
  themeType: "dark" as const,
  fiatCoin:  "USD",
  language:  "en",
  promptSettingConfig: {
    promptMasterPasswordSettingWhenLogin: 1,
    promptPaymentPasswordSettingWhenSign: 1,
  },
};

/* ── Live provider: initializes SDK with chains, then renders modal ────────── */

let _ProviderCache: React.ComponentType<{ options: any; children: React.ReactNode }> | null | "loading" = "loading";

function tryLoadProvider(): React.ComponentType<{ options: any; children: React.ReactNode }> | null {
  if (_ProviderCache !== "loading") return _ProviderCache;
  try {
    const mod = new Function("m", "return require(m)")("@particle-network/auth-core-modal");
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
  const [Provider, setProvider] = useState<React.ComponentType<{ options: any; children: React.ReactNode }> | null>(
    () => tryLoadProvider()
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Initialize particleAuth with chains BEFORE the provider renders
    const initSDK = async () => {
      try {
        const authCore = new Function("m", "return require(m)")("@particle-network/auth-core");
        if (authCore?.particleAuth) {
          authCore.particleAuth.init({
            projectId: config.particle.projectId,
            clientKey: config.particle.clientKey,
            appId: config.particle.appId,
            chains: [ARBITRUM_ONE] as any,
          });
        }
      } catch (err) {
        console.warn("[OneShot] Failed to initialize particleAuth with chains:", err);
      }

      // Now load the provider
      const p = tryLoadProvider();
      if (p) {
        setProvider(() => p);
      }
      setReady(true);
    };

    initSDK();
  }, []);

  if (!Provider || !ready) {
    return (
      <Ctx.Provider value={{ ready: false }}>
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
