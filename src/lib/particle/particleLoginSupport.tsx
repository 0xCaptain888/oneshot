"use client";

import { useEffect } from "react";
import { useConnect } from "@particle-network/auth-core-modal";
import { particleAuthRef } from "@/hooks/useAuth";

/**
 * This component calls useConnect at the top level and stores the functions in a global ref
 * so useAuth can access them imperatively.
 * 
 * Must be rendered inside AuthCoreContextProvider.
 */
export function ParticleLoginSupport() {
  const { connect, disconnect } = useConnect();

  useEffect(() => {
    particleAuthRef.connect = connect;
    particleAuthRef.disconnect = disconnect;
  }, [connect, disconnect]);

  return null;
}
