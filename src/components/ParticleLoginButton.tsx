"use client";

/**
 * ParticleLoginButton — real two-step Particle email OTP flow.
 *
 * Using @particle-network/auth-core-modal v1.5.2
 *
 * Correct two-step flow for email OTP:
 *   Step 1: requestConnectCaptcha({ email })  ← triggers OTP email
 *   Step 2: connect({ email, code })          ← verifies OTP + logs in
 */

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { useParticleReady } from "@/lib/particle/authProvider";
import { Button, Spinner } from "@/components/ui";
import type { Address } from "@/types";
import { useConnect, useUserInfo } from "@particle-network/auth-core-modal";

/* ── Component ───────────────────────────────────────────────────────────── */

type Step = "email" | "otp" | "verifying";

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
  // ✅ Hooks at TOP LEVEL of component — never inside callbacks
  const { connect, requestConnectCaptcha } = useConnect();
  const { userInfo } = useUserInfo();
  const { ready } = useParticleReady();

  const [step, setStep]   = useState<Step>("email");
  const [otp, setOtp]     = useState("");
  const [sending, setSending] = useState(false);

  // When Particle OTP completes → userInfo is set → extract address
  useEffect(() => {
    console.log("[OneShot] userInfo updated:", userInfo);
    if (!userInfo) return;
    
    // Extract address from userInfo
    const addr: string =
      (userInfo as any).wallets?.[0]?.public_address    ??
      (userInfo as any).wallet?.public_address          ??
      (userInfo as any).evm_address                     ??
      (userInfo as any).address                         ??
      "";
    
    console.log("[OneShot] Extracted address:", addr);
    console.log("[OneShot] userInfo structure:", JSON.stringify(userInfo, null, 2));
    
    if (addr) {
      setLoading(false);
      setStep("email");
      onSuccess(addr as Address);
    }
  }, [userInfo, onSuccess, setLoading]);

  /**
   * STEP 1 — send OTP email.
   * Uses requestConnectCaptcha() from useConnect hook (official API).
   */
  const handleSendOtp = useCallback(async () => {
    if (!email || !email.includes("@")) {
      onError("Enter a valid email to continue.");
      return;
    }
    if (!ready) {
      onError("Particle Auth is still initializing — please wait a moment.");
      return;
    }

    setSending(true);
    onError("");          // clear any previous error
    try {
      // Use official Particle API: requestConnectCaptcha from useConnect hook
      const success = await requestConnectCaptcha({ email: email.trim() });
      if (success) {
        setStep("otp");
      } else {
        onError("Failed to send OTP. Please try again.");
      }
    } catch (e: any) {
      const msg: string = e?.message ?? String(e);
      if (msg.includes("rate") || msg.includes("too many")) {
        onError("Too many attempts. Please wait a minute and try again.");
      } else if (msg.includes("invalid email") || msg.includes("email format")) {
        onError("Invalid email address.");
      } else {
        onError(`Failed to send OTP: ${msg}`);
      }
    } finally {
      setSending(false);
    }
  }, [email, ready, requestConnectCaptcha, onError]);

  /**
   * STEP 2 — verify OTP and connect.
   * Correct param shape: { email: string, code: string }
   * This is what Particle SDK validates for email OTP.
   */
  const handleVerifyOtp = useCallback(async () => {
    const code = otp.trim();
    if (!code || code.length < 4) {
      onError("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    setStep("verifying");
    try {
      console.log("[OneShot] Starting OTP verification...");
      const result = await connect({
        email: email.trim(),
        code,
      });
      console.log("[OneShot] connect() result:", JSON.stringify(result, null, 2));
      
      // Try to extract address from connect() return value
      let addr: string = "";
      if (result) {
        addr = result.wallets?.[0]?.public_address ?? "";
        console.log("[OneShot] Address from connect():", addr);
      }
      
      // If no address from connect(), try to get it from userInfo or getUserInfo
      if (!addr) {
        console.log("[OneShot] No address from connect(), trying userInfo...");
        // Wait a bit for userInfo to update
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try userInfo from hook
        if (userInfo) {
          addr = userInfo.wallets?.[0]?.public_address ?? "";
          console.log("[OneShot] Got address from userInfo:", addr);
          console.log("[OneShot] userInfo structure:", JSON.stringify(userInfo, null, 2));
        } else {
          console.log("[OneShot] userInfo is null/undefined");
        }
        
        // If still no address, try getUserInfo from auth-core
        if (!addr) {
          try {
            console.log("[OneShot] Trying getUserInfo from auth-core...");
            const { getUserInfo } = await import("@particle-network/auth-core");
            const info = getUserInfo();
            console.log("[OneShot] getUserInfo() result:", JSON.stringify(info, null, 2));
            if (info) {
              addr = info.wallets?.[0]?.public_address ?? "";
              console.log("[OneShot] Got address from getUserInfo():", addr);
            }
          } catch (e) {
            console.error("[OneShot] Failed to get userInfo from auth-core:", e);
          }
        }
      }
      
      if (addr) {
        console.log("[OneShot] Successfully extracted address:", addr);
        setLoading(false);
        setStep("email");
        onSuccess(addr as Address);
      } else {
        console.error("[OneShot] Failed to get address after login");
        setStep("otp");
        setLoading(false);
        onError("Login successful but failed to get wallet address. Please try again.");
      }
    } catch (e: any) {
      console.error("[OneShot] Error during OTP verification:", e);
      setStep("otp");
      setLoading(false);
      const msg: string = e?.message ?? String(e);
      if (msg.includes("invalid") && msg.includes("code")) {
        onError("Invalid or expired code. Check your email and try again.");
      } else if (msg.includes("expired")) {
        onError("Code expired. Click 'Resend' to get a new one.");
      } else if (msg.includes("invalid connect param")) {
        onError("Auth error — please refresh the page and try again.");
      } else {
        onError(msg || "Verification failed. Please try again.");
      }
    }
  }, [email, otp, connect, userInfo, setLoading, onError, onSuccess]);

  const handleResend = useCallback(async () => {
    setOtp("");
    setStep("email");
    await handleSendOtp();
  }, [handleSendOtp]);

  // ── Render: step 1 — enter email ──
  if (step === "email") {
    return (
      <Button
        onClick={handleSendOtp}
        disabled={loading || sending || !ready}
        size="lg"
        className="mt-5 w-full"
      >
        {sending ? (
          <><Spinner /> Sending code…</>
        ) : !ready ? (
          <><Spinner /> Initializing…</>
        ) : (
          <>Continue <ArrowRight className="h-4 w-4" /></>
        )}
      </Button>
    );
  }

  // ── Render: step 2 — enter OTP ──
  return (
    <div className="mt-5 space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent-soft/40 px-4 py-3">
        <Mail className="h-4 w-4 shrink-0 text-accent" />
        <p className="text-sm text-muted">
          We sent a 6-digit code to <span className="font-medium text-white">{email}</span>
        </p>
      </div>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        onKeyDown={(e) => { if (e.key === "Enter" && otp.length >= 4) handleVerifyOtp(); }}
        placeholder="Enter 6-digit code"
        autoFocus
        className="h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-center text-lg font-mono tracking-widest outline-none ring-accent/40 transition focus:ring-2"
        disabled={step === "verifying"}
      />

      <Button
        onClick={handleVerifyOtp}
        loading={step === "verifying"}
        disabled={otp.length < 4 || step === "verifying"}
        size="lg"
        className="w-full"
      >
        Verify & Sign in
      </Button>

      <button
        onClick={handleResend}
        disabled={sending || step === "verifying"}
        className="w-full text-center text-sm text-muted hover:text-white transition-colors disabled:opacity-50"
      >
        {sending ? "Sending…" : "Didn't receive it? Resend"}
      </button>
    </div>
  );
}

/** Logout hook — at component top level, per React rules */
export function useParticleDisconnect() {
  const { disconnect } = useConnect();
  return disconnect;
}
