"use client";

import { useEffect, useState } from "react";
import { particleAuthRef } from "@/hooks/useAuth";

/**
 * This component calls useConnect at the top level and stores the functions in a global ref
 * so useAuth can access them imperatively.
 */
export function ParticleLoginSupport() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    import("@particle-network/auth-core-modal").then((mod) => {
      if (!mounted) return;
      
      // We need to call useConnect inside a component that's wrapped by AuthCoreContextProvider
      // Since we can't call hooks conditionally, we'll use the connect function directly
      // from the auth-core package
      import("@particle-network/auth-core").then((authCore) => {
        if (!mounted) return;
        particleAuthRef.connect = authCore.connect;
        particleAuthRef.disconnect = authCore.disconnect;
        setReady(true);
      });
    }).catch((err) => {
      console.error("Failed to load Particle SDK:", err);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return null;
}
