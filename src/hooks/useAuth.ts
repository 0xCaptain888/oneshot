"use client";

/**
 * useAuth — login / logout hook.
 *
 * In MOCK mode: any email → deterministic fake address (no SDK calls).
 * In LIVE mode: Particle email OTP → real embedded wallet address.
 *
 * The Particle hooks (useConnect) are called at the top level of the
 * ParticleLoginSupport component (rendered only in live mode), which
 * passes the connect function down via a global ref.
 */

import { useCallback, useEffect, useRef } from "react";
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

/**
 * Global ref to hold the Particle connect/disconnect functions.
 * Set by ParticleLoginSupport component (which calls useConnect at top level).
 */
export const particleAuthRef: {
  connect: ((opts: any) => Promise<any>) | null;
  disconnect: (() => Promise<void>) | null;
} = { connect: null, disconnect: null };

/** Mock login — used when IS_MOCK=true */
export function useAuth() {
  const setAuth = useStore((s) => s.setAuth);
  const disconnect = useStore((s) => s.disconnect);
  const connected = useStore((s) => s.connected);
  const email = useStore((s) => s.email);
  const address = useStore((s) => s.address);

  const mockLogin = useCallback(async (userEmail: string) => {
    await sleep(700);
    setAuth({ email: userEmail, address: mockAddressFromEmail(userEmail) });
  }, [setAuth]);

  const liveLogin = useCallback(async (userEmail: string) => {
    if (!particleAuthRef.connect) {
      throw new Error(
        "Particle Auth not available。请确保 @particle-network/auth-core-modal 已正确安装。"
      );
    }

    // Trigger email OTP flow - use email parameter (not socialType)
    const userInfo = await particleAuthRef.connect({
      email: userEmail,
    });

    // Extract the wallet address
    const addr: string =
      userInfo?.wallet?.public_address ??
      userInfo?.wallets?.[0]?.public_address ??
      userInfo?.address ??
      "";

    if (!addr) throw new Error("Particle 认证未返回钱包地址。");
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
    if (!IS_MOCK && particleAuthRef.disconnect) {
      try {
        await particleAuthRef.disconnect();
      } catch { /* ignore — always clear local state */ }
    }
    disconnect();
  }, [disconnect]);

  return { login, logout, connected, email, address };
}
