"use client";

/**
 * useAuth — thin state hook.
 *
 * In MOCK mode:  handles the full login/logout cycle here (no SDK needed).
 * In LIVE mode:  login is handled by <ParticleLoginButton> (a component that
 *                calls useConnect/useUserInfo at its own top level — the only
 *                legal place for React hooks).
 *
 *                This hook just owns the Zustand state and the mock path.
 *                logout() disconnects from Particle then clears state.
 */

import { useCallback } from "react";
import type { Address } from "@/types";
import { IS_MOCK } from "@/config";
import { useStore } from "@/lib/store";
import { sleep } from "@/lib/utils";

function mockAddressFromEmail(email: string): Address {
  let h = 0;
  for (let i = 0; i < email.length; i++)
    h = (h * 31 + email.charCodeAt(i)) >>> 0;
  const hex = h.toString(16).padStart(8, "0");
  return `0x${hex}${"a3f9c1e770bb42d5e9c8".repeat(2)}`.slice(0, 42) as Address;
}

export function useAuth() {
  const setAuth    = useStore((s) => s.setAuth);
  const disconnect = useStore((s) => s.disconnect);
  const connected  = useStore((s) => s.connected);
  const email      = useStore((s) => s.email);
  const address    = useStore((s) => s.address);

  /**
   * Mock login only. In live mode, <ParticleLoginButton> calls
   * useConnect() at its top level and invokes setAuth() via onSuccess().
   */
  const mockLogin = useCallback(async (userEmail: string) => {
    await sleep(700);
    setAuth({ email: userEmail, address: mockAddressFromEmail(userEmail) });
  }, [setAuth]);

  /**
   * setAuth is exposed so <ParticleLoginButton> can call it after OTP.
   */
  const confirmLiveAuth = useCallback((userEmail: string, addr: Address) => {
    setAuth({ email: userEmail, address: addr });
  }, [setAuth]);

  const logout = useCallback(async () => {
    console.log("[OneShot] Logout function called");
    if (typeof window !== 'undefined') {
      console.log("[OneShot] Window is available");
    }
    if (!IS_MOCK) {
      // Import and call Particle disconnect imperatively (not a hook call)
      try {
        console.log("[OneShot] Importing Particle disconnect...");
        const { disconnect: particleDisconnect } = await import("@particle-network/auth-core");
        console.log("[OneShot] Calling Particle disconnect...");
        await particleDisconnect();
        console.log("[OneShot] Particle disconnect completed");
      } catch (e) {
        console.error("[OneShot] Particle disconnect failed:", e);
      }
    }
    console.log("[OneShot] Clearing Zustand state...");
    disconnect();
    console.log("[OneShot] Logout completed");
  }, [disconnect]);

  return {
    mockLogin,
    confirmLiveAuth,
    logout,
    connected,
    email,
    address,
    IS_MOCK,
  };
}
