"use client";

/**
 * Particle Auth Provider wrapper.
 *
 * Wraps the app in AuthCoreContextProvider (from @particle-network/auth-core-modal)
 * so that useConnect / useUserInfo hooks work correctly at component level.
 *
 * Credentials:
 *   Project ID : 3b1fc10f-b2ea-48dc-ad62-6b20b2264fe0
 *   Client Key : crwCy0oYSHQzQnY6WNQRwGz9UO6bEI4e5l3z4yl1
 *   App ID     : 12039a72-9e05-4f0a-a949-57dd2ec46db7
 *
 * In MOCK mode this is a no-op passthrough — no Particle SDK loaded at all.
 */

import React from "react";
import { IS_MOCK, config } from "@/config";
// @ts-ignore — Particle SDK has broken package.json exports field
import { AuthCoreContextProvider } from "@particle-network/auth-core-modal";

/** Arbitrum One chain definition for Particle SDK */
const ARBITRUM_ONE = {
  id: 42161,
  name: "Arbitrum One",
  network: "arbitrum",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://arb1.arbitrum.io/rpc"] } },
  blockExplorers: { default: { name: "Arbiscan", url: "https://arbiscan.io" } },
};

export function ParticleAuthProvider({ children }: { children: React.ReactNode }) {
  if (IS_MOCK) {
    // In mock mode: passthrough, no SDK
    return <>{children}</>;
  }

  return (
    <AuthCoreContextProvider
      options={{
        projectId: config.particle.projectId,
        clientKey: config.particle.clientKey,
        appId: config.particle.appId,
        chains: [ARBITRUM_ONE],
        authTypes: ["email"],
        themeType: "dark",
        fiatCoin: "USD",
        language: "en",
        promptSettingConfig: {
          promptMasterPasswordSettingWhenLogin: 1,
          promptPaymentPasswordSettingWhenSign: 1,
        },
      }}
    >
      {children}
    </AuthCoreContextProvider>
  );
}
