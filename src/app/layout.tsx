import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { ParticleAuthProvider } from "@/lib/particle/authProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "OneShot — fund from any chain, one signature",
  description:
    "A chain-abstracted prediction & trading terminal. Fund from any chain in one click, " +
    "take a position with one signature, hand execution to a scoped AI agent. " +
    "Built on Particle Universal Accounts + EIP-7702.",
  applicationName: "OneShot",
  openGraph: {
    title: "OneShot",
    description: "Fund from any chain in one click. One signature. Chains invisible.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0B14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="app-bg min-h-screen font-sans antialiased">
        <ParticleAuthProvider>
          {children}
        </ParticleAuthProvider>
      </body>
    </html>
  );
}
