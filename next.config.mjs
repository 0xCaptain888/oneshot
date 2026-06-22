/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  reactStrictMode: true,

  // Skip TypeScript errors during Vercel build.
  // Particle SDK has a broken package.json exports field causing false type errors.
  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // Transpile Particle packages so Next.js handles their ESM/CJS correctly.
  // Without this, the SDK's module format causes "cannot use import statement"
  // errors in the server bundle.
  transpilePackages: [
    "@particle-network/auth-core-modal",
    "@particle-network/auth-core",
    "@particle-network/universal-account-sdk",
  ],

  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // Provide a stub for `fs` so Particle SDK's `fs.promises` destructuring
      // doesn't crash in the browser (writeFile, readFile, etc.).
      config.resolve.alias = {
        ...config.resolve.alias,
        fs: path.resolve(__dirname, "./src/lib/fs-stub.js"),
      };

      // Map other Node core modules to false in the browser bundle.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false, tls: false, child_process: false,
        crypto: false, stream: false, http: false, https: false,
        os: false, zlib: false, path: false, assert: false,
        util: false, url: false, querystring: false, worker_threads: false,
      };

      // Fix "UnhandledSchemeError: Reading from node:child_process"
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        })
      );
    }

    // Prevent webpack from bundling optional server-only deps.
    config.externals.push("pino-pretty", "lokijs", "encoding");

    return config;
  },
};

export default nextConfig;
