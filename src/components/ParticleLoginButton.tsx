"use client";

/**
 * ParticleLoginButton — handles the two-step email OTP flow.
 *
 * Step 1: User enters email → call requestConnectCaptcha({ email }) to send OTP
 * Step 2: User enters OTP code → call connect({ email, code }) to complete login
 *
 * React hooks (useConnect, useUserInfo) are called at the top level.
 */

import { useCallback, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useParticleReady } from "@/lib/particle/authProvider";
import { Button, Spinner } from "@/components/ui";
import { useConnect, useUserInfo } from "@particle-network/auth-core-modal";
import type { Address } from "@/types";

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
  const { connect, disconnect: _disconnect, requestConnectCaptcha } = useConnect();
  const { userInfo } = useUserInfo();
  const { ready } = useParticleReady();

  const [step, setStep] = useState<"email" | "otp">("email");
  const [otpCode, setOtpCode] = useState("");

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

  // Step 1: Send OTP to email
  const handleSendOTP = useCallback(async () => {
    if (!email || !email.includes("@")) {
      onError("Enter a valid email to continue.");
      return;
    }
    if (!ready) {
      onError("Initializing Particle Auth… please wait a moment and try again.");
      return;
    }
    setLoading(true);
    try {
      const success = await requestConnectCaptcha({ email: email.trim() });
      if (success) {
        setStep("otp");
        setLoading(false);
      } else {
        setLoading(false);
        onError("Failed to send OTP. Please try again.");
      }
    } catch (e: any) {
      setLoading(false);
      const msg = e?.message ?? "Failed to send OTP.";
      if (msg.includes("network") || msg.includes("fetch")) {
        onError("Network error. Check your connection and try again.");
      } else {
        onError(msg);
      }
    }
  }, [email, ready, requestConnectCaptcha, setLoading, onError]);

  // Step 2: Verify OTP and complete login
  const handleVerifyOTP = useCallback(async () => {
    if (!otpCode || otpCode.length < 4) {
      onError("Enter the verification code.");
      return;
    }
    setLoading(true);
    try {
      await connect({ email: email.trim(), code: otpCode.trim() });
      // onSuccess fires from the useEffect above when userInfo updates
    } catch (e: any) {
      setLoading(false);
      const msg = e?.message ?? "Verification failed.";
      if (msg.includes("invalid") || msg.includes("code")) {
        onError("Invalid verification code. Please try again.");
      } else if (msg.includes("expired")) {
        onError("Verification code expired. Please request a new one.");
      } else {
        onError(msg);
      }
    }
  }, [email, otpCode, connect, setLoading, onError]);

  const handleLogin = step === "email" ? handleSendOTP : handleVerifyOTP;

  return (
    <div className="mt-5 space-y-3">
      {step === "email" ? (
        <Button
          onClick={handleLogin}
          disabled={loading || !ready}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <><Spinner /> Sending OTP…</>
          ) : !ready ? (
            <><Spinner /> Initializing…</>
          ) : (
            <>Continue <ArrowRight className="h-4 w-4" /></>
          )}
        </Button>
      ) : (
        <>
          <input
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="Enter verification code"
            className="h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-base outline-none ring-accent/40 transition focus:ring-2"
            disabled={loading}
          />
          <Button
            onClick={handleLogin}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <><Spinner /> Verifying…</>
            ) : (
              <>Verify & Login <ArrowRight className="h-4 w-4" /></>
            )}
          </Button>
          <button
            onClick={() => {
              setStep("email");
              setOtpCode("");
              onError("");
            }}
            className="w-full text-center text-sm text-muted hover:text-white"
            disabled={loading}
          >
            ← Change email
          </button>
        </>
      )}
    </div>
  );
}

/** Logout hook — also at top level, per React rules */
export function useParticleDisconnect() {
  const { disconnect } = useConnect();
  return disconnect;
}
