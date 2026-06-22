"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getChain } from "@/lib/chains";

/* ----------------------------------- Button ---------------------------------- */

type ButtonProps = {
  variant?: "primary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  title?: string;
  "aria-label"?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variants: Record<string, string> = {
    primary: "bg-accent text-white hover:bg-accent/90",
    ghost: "border border-border bg-surface-2 text-white hover:bg-surface-2/70",
    danger: "bg-danger text-white hover:bg-danger/90",
    success: "bg-success text-white hover:bg-success/90",
  };
  const sizes: Record<string, string> = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };
  return (
    <button
      className={cn(
        "btn rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

/* ------------------------------------ Chip ----------------------------------- */

/** A small chain chip with the chain's color. */
export function ChainChip({ chainId, className }: { chainId: number; className?: string }) {
  const chain = getChain(chainId);
  if (!chain) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: chain.color }} />
      {chain.shortName}
    </span>
  );
}

/* ----------------------------------- Badge ----------------------------------- */

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "success" | "danger" | "warn";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-surface-2 text-muted border-border",
    accent: "bg-accent-soft text-accent border-accent/30",
    success: "bg-success/10 text-success border-success/30",
    danger: "bg-danger/10 text-danger border-danger/30",
    warn: "bg-warn/10 text-warn border-warn/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ---------------------------------- Skeleton --------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-lg bg-surface-2", className)} />;
}
