"use client";

import React, { useEffect, useState } from "react";
import { config } from "@/config";
import { particleAuthRef } from "@/hooks/useAuth";

export function ParticleAuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Initialize Particle auth-core directly on client side
    import("@particle-network/auth-core").then(async (authCore) => {
      // Initialize the auth core with our config
      authCore.particleAuth.init({
        projectId: config.particle.projectId,
        clientKey: config.particle.clientKey,
        appId: config.particle.appId,
        chains: [], // No chains needed for email auth
      });

      // Store the connect and disconnect functions
      particleAuthRef.connect = authCore.connect;
      particleAuthRef.disconnect = authCore.disconnect;
      
      setReady(true);
    }).catch((err) => {
      console.error("Failed to initialize Particle auth-core:", err);
    });
  }, []);

  // Always render children, even before Particle is ready
  // The login will just fail gracefully if not ready yet
  return <>{children}</>;
}
