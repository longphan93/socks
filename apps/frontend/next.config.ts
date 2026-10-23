import { join } from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gói sẵn server tối giản để Docker image không cần node_modules của FE.
  output: 'standalone',
  // Monorepo: trace file từ gốc workspace, không phải từ thư mục app.
  outputFileTracingRoot: join(import.meta.dirname, '../..'),
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
