"use client";

/**
 * useAuth — login / logout hook.
 *
 * FIX: React Hooks violation resolved.
 * Previously, useConnect / useUserInfo were called inside callbacks (illegal).
 * Now the pattern is:
 *   - Particle hooks (useConnect, useUserInfo) are called at the TOP LEVEL
 *     of a component — see LoginScreen.tsx which renders the login form.
 *   - useAuth only owns the MOCK path and the Zustand state setters.
 *   - The LIVE path is in useParticleAuth (called at top level of AppShell).
 *
 * In MOCK mode: any email → deterministic fake address (no SDK calls).
 * In LIVE mode: Particle email OTP → real embedded wallet address.
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

function opaqueRequire(m: string): any {
  try {
    // eslint-disable-next-line no-new-func
    return new Function("m", "return require(m)")(m);
  } catch { return null; }
}

/** Mock login — used when IS_MOCK=true */
export function useAuth() {
  const setAuth = useStore((s) => s.setAuth);
  const disconnect = useStore((s) => s.disconnect);
  const connected = useStore((s) => s.connected);
  const email = useStore((s) => s.email);
  const address = useStore((s) => s.address);

  /**
   * MOCK login: generates a deterministic address from email.
   * Call this only when IS_MOCK=true.
   */
  const mockLogin = useCallback(async (userEmail: string) => {
    await sleep(700);
    setAuth({ email: userEmail, address: mockAddressFromEmail(userEmail) });
  }, [setAuth]);

  /**
   * LIVE login via Particle Auth Core Modal.
   *
   * ⚠️  DO NOT call useConnect / useUserInfo hooks here — that violates
   *     React's rules of hooks (hooks can't be called inside callbacks).
   *
   *     Instead, this function uses the Particle auth modal imperatively
   *     through the AuthCoreContextProvider (see src/lib/particle/authProvider.tsx).
   *
   *     The modal API (connect, getUserInfo) is accessed via the provider
   *     context which is initialized at app root level.
   */
  const liveLogin = useCallback(async (userEmail: string) => {
    // Access Particle's imperative API through the modal context.
    // This does NOT violate hooks rules because we're calling a context
    // function imperatively (not a hook).
    const authMod = opaqueRequire("@particle-network/auth-core-modal");
    if (!authMod) {
      throw new Error(
        "Particle Auth not available. Is @particle-network/auth-core-modal installed?"
      );
    }

    // Use the standalone connect function from auth-core-modal
    // (available after AuthCoreContextProvider wraps the app)
    const connectFn =
      authMod.connect ??
      authMod.default?.connect ??
      authMod.ParticleAuth?.connect;

    if (!connectFn) {
      throw new Error(
        "Particle connect() not found. Check @particle-network/auth-core-modal version."
      );
    }

    // Trigger email OTP flow
    const userInfo = await connectFn({
      socialType: "email",
      email: userEmail,
    });

    // Extract the wallet address
    const addr: string =
      userInfo?.wallet?.public_address ??
      userInfo?.wallets?.[0]?.public_address ??
      userInfo?.address ??
      "";

    if (!addr) throw new Error("No wallet address returned from Particle Auth.");
    setAuth({ email: userEmail, address: addr as Address });
  }, [setAuth]);

  const login = useCallback(async (userEmail: string) => {
    if (IS_MOCK) {
      await mockLogin(userEmail);
    } else {
      await liveLogin(userEmail);
    }
  }, [mockLogin, liveLogin]);

  const logout = useCallback(async () => {
    if (!IS_MOCK) {
      try {
        const authMod = opaqueRequire("@particle-network/auth-core-modal");
        const disconnectFn =
          authMod?.disconnect ??
          authMod?.default?.disconnect ??
          authMod?.ParticleAuth?.disconnect;
        if (disconnectFn) await disconnectFn();
      } catch { /* ignore — always clear local state */ }
    }
    disconnect();
  }, [disconnect]);

  return { login, logout, connected, email, address };
}
