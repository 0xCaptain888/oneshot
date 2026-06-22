/**
 * Ambient type declarations for Particle Network SDK v1.5.x
 *
 * @particle-network/auth-core-modal@1.5.2
 * @particle-network/auth-core@1.5.2
 * @particle-network/universal-account-sdk@0.5.0
 *
 * The SDK's package.json "exports" field is incompatible with TypeScript
 * "bundler" moduleResolution. These declarations let the build pass.
 * The SDK is loaded at runtime via opaqueRequire() / new Function().
 */

declare module "@particle-network/auth-core-modal" {
  import type { ReactNode, ComponentType } from "react";

  /** Options for AuthCoreContextProvider (v1.x shape) */
  interface AuthCoreOptions {
    projectId: string;
    clientKey: string;
    appId: string;
    chains?: any[];
    themeType?: "dark" | "light";
    fiatCoin?: string;
    language?: string;
    promptSettingConfig?: {
      promptMasterPasswordSettingWhenLogin?: number;
      promptPaymentPasswordSettingWhenSign?: number;
    };
    [key: string]: any;
  }

  /** The Provider component — wrap your app with this */
  export const AuthCoreContextProvider: ComponentType<{
    options: AuthCoreOptions;
    children: ReactNode;
  }>;

  /** User info returned after successful auth */
  export interface UserInfo {
    uuid?: string;
    token?: string;
    wallet?: { public_address: string; chain_name?: string };
    wallets?: Array<{ public_address: string; chain_name?: string }>;
    evm_address?: string;
    address?: string;
    name?: string;
    avatar?: string;
    email?: string;
    phone?: string;
    [key: string]: any;
  }

  /** Connect params for email OTP (Step 2) */
  export interface EmailConnectParams {
    email: string;
    code: string;
  }

  /** Connect params for social OAuth */
  export interface SocialConnectParams {
    socialType: "google" | "twitter" | "github" | "facebook" | "discord" | "twitch" | "microsoft" | "linkedin" | "apple";
  }

  export type ConnectParams = EmailConnectParams | SocialConnectParams;

  /** useConnect hook */
  export function useConnect(): {
    connect(params: ConnectParams): Promise<UserInfo>;
    disconnect(): Promise<void>;
    sendEmailCode(email: string): Promise<void>;
    sendPhoneCode(phone: string): Promise<void>;
    connected: boolean;
    connecting: boolean;
  };

  /** useUserInfo hook */
  export function useUserInfo(): {
    userInfo: UserInfo | null | undefined;
    getUserInfo(): Promise<UserInfo | null>;
  };

  /** useEthereum hook */
  export function useEthereum(): {
    address: string | null;
    provider: any;
    chainId: number;
  };

  export default any;
}

declare module "@particle-network/auth-core" {
  export const ParticleAuthProvider: any;
  export const useConnect: any;
  export const useAuthCore: any;
  export default any;
}

declare module "@particle-network/universal-account-sdk" {
  export class UniversalAccount {
    constructor(config: {
      projectId: string;
      clientKey: string;
      appId: string;
      ownerAddress?: string | null;
      [key: string]: any;
    });
    getSmartAccountOptions(): Promise<{ smartAccountAddress?: string; [k: string]: any }>;
    getUniversalAccountAddress(): Promise<string>;
    getPrimaryAssets(): Promise<{ assets?: any[]; [k: string]: any }>;
    getAssets(): Promise<any>;
    createTransferTransaction(opts: Record<string, any>): Promise<any>;
    createUniversalTransaction(opts: Record<string, any>): Promise<any>;
    signAndSendTransaction(tx: any): Promise<{ transactionId?: string; hash?: string; userOpHash?: string; [k: string]: any }>;
    [key: string]: any;
  }
  export default UniversalAccount;
}
