/**
 * Ambient type declarations for Particle Network packages.
 *
 * The Particle SDK's package.json "exports" field is incompatible with
 * TypeScript "bundler" moduleResolution, preventing auto type resolution.
 *
 * These declarations provide a minimal type surface so TypeScript is
 * satisfied. The actual SDK is loaded at runtime via opaqueRequire()
 * in live.ts and useAuth.ts.
 *
 * Remove this file once Particle publishes a fixed package.json.
 */

declare module "@particle-network/universal-account-sdk" {
  export class UniversalAccount {
    constructor(config: {
      projectId: string;
      clientKey: string;
      appId: string;
      ownerAddress?: string | null;
      [key: string]: any;
    });
    getSmartAccountOptions(): Promise<{ smartAccountAddress?: string; address?: string; [k: string]: any }>;
    getUniversalAccountAddress(): Promise<string>;
    getPrimaryAssets(): Promise<{ assets?: any[]; tokenAssets?: any[]; [k: string]: any }>;
    getAssets(): Promise<any>;
    createTransferTransaction(opts: Record<string, any>): Promise<any>;
    createUniversalTransaction(opts: Record<string, any>): Promise<any>;
    signAndSendTransaction(tx: any): Promise<{ transactionId?: string; hash?: string; userOpHash?: string; [k: string]: any }>;
    [key: string]: any;
  }
  export default UniversalAccount;
}

declare module "@particle-network/auth-core-modal" {
  export function getAuthCoreModalSingleton(): {
    connect(opts: Record<string, any>): Promise<void>;
    disconnect(): Promise<void>;
    logout(): Promise<void>;
    getAddress(): Promise<string>;
    getUserInfo(): Promise<{ wallets?: Array<{ public_address: string }>; [k: string]: any }>;
    [key: string]: any;
  } | null;
  export const ParticleAuth: any;
  export default any;
}

declare module "@particle-network/auth-core" {
  export const useConnect: any;
  export const useAuthCore: any;
  export const ParticleAuthProvider: any;
  export default any;
}
