/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Skip TypeScript errors during build.
  // The Particle Network SDK has a broken package.json "exports" field that
  // causes false type errors. Type-checking runs in CI via `npm run typecheck`.
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip ESLint errors during Vercel build (runs separately in CI).
  eslint: {
    ignoreDuringBuilds: true,
  },

  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // Map Node core modules to false in the browser bundle.
      // Particle / ethers transitive deps reference these.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        os: false,
        zlib: false,
        path: false,
        assert: false,
        util: false,
        url: false,
        querystring: false,
        worker_threads: false,
      };

      // Fix "UnhandledSchemeError: Reading from node:child_process"
      // Some deps import core modules with "node:" prefix.
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
