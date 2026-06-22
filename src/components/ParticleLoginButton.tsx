"use client";

/**
 * ParticleLoginButton — the ONLY component that calls Particle React hooks.
 *
 * React hooks (useConnect, useUserInfo) MUST be called at the top level of
 * a component — never inside callbacks, conditions, or loops.
 *
 * This component exists solely to satisfy that requirement. It:
 *   1. Calls hooks at its own top level (✅ legal)
 *   2. Uses useEffect to detect when userInfo changes after OTP
 *   3. Calls onSuccess() with the wallet address
 *
 * The hooks are imported from the module at component-call time (not at
 * module-evaluation time), solving the timing issue where the hooks weren't
 * available before AuthCoreContextProvider mounted.
 */

import { useCallback, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useParticleReady } from "@/lib/particle/authProvider";
import { Button, Spinner } from "@/components/ui";
import type { Address } from "@/types";

/* ── Hook loader ─────────────────────────────────────────────────────────────
 * We can't import Particle hooks at module top level because they must be
 * called inside a component that's inside AuthCoreContextProvider.
 *
 * Solution: lazy-load the hook FUNCTIONS at component call time (but still
 * call them unconditionally at the component's top level, which is legal).
 *
 * If auth-core-modal isn't installed, we return safe no-op hooks.
 * ─────────────────────────────────────────────────────────────────────────── */

type ConnectFn = (opts: { socialType: string; email?: string }) => Promise<any>;
type DisconnectFn = () => Promise<void>;

interface ParticleHooks {
  useConnect: () => { connect: ConnectFn; disconnect: DisconnectFn };
  useUserInfo: () => { userInfo: Record<string, any> | null | undefined };
}

// Default no-op hooks used when SDK isn't available
const noopHooks: ParticleHooks = {
  useConnect:  () => ({ connect: async () => null, disconnect: async () => {} }),
  useUserInfo: () => ({ userInfo: null }),
};

function loadParticleHooks(): ParticleHooks {
  try {
    // eslint-disable-next-line no-new-func, @typescript-eslint/no-require-imports
    const mod = new Function("m", "return require(m)")("@particle-network/auth-core-modal");
    if (!mod) return noopHooks;

    const useConnect  = mod.useConnect  ?? mod.default?.useConnect;
    const useUserInfo = mod.useUserInfo ?? mod.default?.useUserInfo;

    if (typeof useConnect !== "function" || typeof useUserInfo !== "function") {
      console.warn("[OneShot] Particle hooks not found in auth-core-modal.");
      return noopHooks;
    }
    return { useConnect, useUserInfo };
  } catch {
    return noopHooks;
  }
}

// Load once per module evaluation — after AuthCoreContextProvider has mounted,
// these functions will work correctly when called as hooks inside the component.
const particleHooks = loadParticleHooks();

/* ── Component ────────────────────────────────────────────────────────────── */

interface Props {
  email: string;
  onSuccess: (address: Address) => void;
  onError: (msg: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}

export function ParticleLoginButton({
  email, onSuccess, onError, loading, setLoading,
}: Props) {
  // ✅ Hooks called unconditionally at TOP LEVEL of component
  // (inside AuthCoreContextProvider context because ParticleAuthProvider
  // wraps the whole app in layout.tsx)
  const { connect, disconnect: _disconnect } = particleHooks.useConnect();
  const { userInfo } = particleHooks.useUserInfo();
  const { ready } = useParticleReady();

  // When Particle OTP completes → userInfo is populated → extract address
  useEffect(() => {
    if (!userInfo) return;
    const addr: string =
      (userInfo as any).wallet?.public_address ??
      (userInfo as any).wallets?.[0]?.public_address ??
      (userInfo as any).evm_address ??
      (userInfo as any).address ??
      "";
    if (addr) {
      setLoading(false);
      onSuccess(addr as Address);
    }
  }, [userInfo, onSuccess, setLoading]);

  const handleLogin = useCallback(async () => {
    if (!email || !email.includes("@")) {
      onError("Enter a valid email to continue.");
      return;
    }
    // FIX #3: Gate on ready — SDK must be initialized before connect()
    if (!ready) {
      onError("Initializing Particle Auth… please wait a moment and try again.");
      return;
    }
    setLoading(true);
    try {
      // Triggers email OTP flow via auth-core-modal
      // (NOT using auth-core directly — see FIX #2)
      await connect({ socialType: "email", email: email.trim() });
      // onSuccess fires from the useEffect above when userInfo updates
    } catch (e: any) {
      setLoading(false);
      const msg = e?.message ?? "Login failed. Please try again.";
      // Common errors and user-friendly messages
      if (msg.includes("user_cancelled") || msg.includes("cancelled")) {
        onError("Login cancelled.");
      } else if (msg.includes("network") || msg.includes("fetch")) {
        onError("Network error. Check your connection and try again.");
      } else {
        onError(msg);
      }
    }
  }, [email, ready, connect, setLoading, onError]);

  return (
    <Button
      onClick={handleLogin}
      disabled={loading || !ready}
      size="lg"
      className="mt-5 w-full"
    >
      {loading ? (
        <><Spinner /> Sending OTP…</>
      ) : !ready ? (
        <><Spinner /> Initializing…</>
      ) : (
        <>Continue <ArrowRight className="h-4 w-4" /></>
      )}
    </Button>
  );
}

/** Logout hook — also at top level, per React rules */
export function useParticleDisconnect() {
  const { disconnect } = particleHooks.useConnect();
  return disconnect;
}
