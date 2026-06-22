"use client";

/**
 * ParticleLoginSupport — calls useConnect at the top level and exposes
 * the connect/disconnect functions via a global ref so useAuth can use them
 * imperatively (without violating React's rules of hooks).
 *
 * This component must be rendered inside AuthCoreContextProvider.
 * Only rendered in LIVE mode (see layout.tsx).
 */

import { useEffect } from "react";
// @ts-ignore — Particle SDK has broken package.json exports field
import { useConnect } from "@particle-network/auth-core-modal";
import { particleAuthRef } from "@/hooks/useAuth";

export function ParticleLoginSupport() {
  const { connect, disconnect } = useConnect();

  useEffect(() => {
    particleAuthRef.connect = connect;
    particleAuthRef.disconnect = disconnect;
    return () => {
      particleAuthRef.connect = null;
      particleAuthRef.disconnect = null;
    };
  }, [connect, disconnect]);

  return null; // This component renders nothing
}
