/**
 * Central configuration.
 * Reads env vars and decides whether we're in MOCK or LIVE mode.
 *
 * MOCK mode: no Particle keys, OR NEXT_PUBLIC_MOCK_MODE=true
 * LIVE mode: Particle keys present and NEXT_PUBLIC_MOCK_MODE != "true"
 */

function env(key: string, fallback = ""): string {
  const v = process.env[key];
  return v === undefined || v === null ? fallback : v;
}

export const config = {
  appName: env("NEXT_PUBLIC_APP_NAME", "OneShot"),
  appUrl: env("NEXT_PUBLIC_APP_URL", "https://oneshot-seven-inky.vercel.app"),

  particle: {
    projectId: env("NEXT_PUBLIC_PARTICLE_PROJECT_ID", "3b1fc10f-b2ea-48dc-ad62-6b20b2264fe0"),
    clientKey: env("NEXT_PUBLIC_PARTICLE_CLIENT_KEY", "crwCy0oYSHQzQnY6WNQRwGz9UO6bEI4e5l3z4yl1"),
    appId: env("NEXT_PUBLIC_PARTICLE_APP_ID", "12039a72-9e05-4f0a-a949-57dd2ec46db7"),
  },

  primaryChainId: Number(env("NEXT_PUBLIC_PRIMARY_CHAIN_ID", "42161")),
  settlementToken: env("NEXT_PUBLIC_SETTLEMENT_TOKEN_SYMBOL", "USDC"),

  agent: {
    maxSpendUsd: Number(env("NEXT_PUBLIC_AGENT_MAX_SPEND_USD", "100")),
    maxTxPerRun: Number(env("NEXT_PUBLIC_AGENT_MAX_TX_PER_RUN", "5")),
  },
} as const;

/**
 * MOCK mode when:
 *  - NEXT_PUBLIC_MOCK_MODE=true  (explicit override), OR
 *  - No Particle project id configured
 */
export const IS_MOCK =
  env("NEXT_PUBLIC_MOCK_MODE") === "true" || !config.particle.projectId;
