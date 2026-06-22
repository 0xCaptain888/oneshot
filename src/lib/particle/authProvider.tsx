"use client";

import React, { useEffect, useState } from "react";
import { config } from "@/config";

export function ParticleAuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [Provider, setProvider] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    // Only load Particle SDK on client side
    setMounted(true);
    
    import("@particle-network/auth-core-modal").then((mod) => {
      setProvider(() => mod.AuthCoreContextProvider);
    }).catch((err) => {
      console.error("Failed to load Particle SDK:", err);
    });
  }, []);

  if (!mounted || !Provider) {
    return <>{children}</>;
  }

  return (
    <Provider
      options={{
        projectId: config.particle.projectId,
        clientKey: config.particle.clientKey,
        appId: config.particle.appId,
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
    </Provider>
  );
}
