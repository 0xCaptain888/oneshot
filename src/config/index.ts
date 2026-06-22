/**
 * Central configuration.
 * Reads env vars and decides whether we're in MOCK or LIVE mode.
 *
 * MOCK mode: no Particle keys, OR NEXT_PUBLIC_MOCK_MODE=true
 * LIVE mode: Particle keys present and NEXT_PUBLIC_MOCK_MODE != "true"
 *
 * IMPORTANT: Next.js only inlines NEXT_PUBLIC_* vars when accessed directly
 * (e.g., process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID). Dynamic access like
 * process.env[key] does NOT work in the browser.
 */

export const config = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "OneShot",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://oneshot-seven-inky.vercel.app",

  particle: {
    projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID || "",
    clientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY || "",
    appId: process.env.NEXT_PUBLIC_PARTICLE_APP_ID || "",
  },

  primaryChainId: Number(process.env.NEXT_PUBLIC_PRIMARY_CHAIN_ID || "42161"),
  settlementToken: process.env.NEXT_PUBLIC_SETTLEMENT_TOKEN_SYMBOL || "USDC",

  agent: {
    maxSpendUsd: Number(process.env.NEXT_PUBLIC_AGENT_MAX_SPEND_USD || "100"),
    maxTxPerRun: Number(process.env.NEXT_PUBLIC_AGENT_MAX_TX_PER_RUN || "5"),
  },
} as const;

/**
 * MOCK mode when:
 *  - NEXT_PUBLIC_MOCK_MODE=true  (explicit override), OR
 *  - No Particle project id configured
 */
export const IS_MOCK =
  process.env.NEXT_PUBLIC_MOCK_MODE === "true" || !config.particle.projectId;
