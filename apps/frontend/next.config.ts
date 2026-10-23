import { join } from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gói sẵn server tối giản để Docker image không cần node_modules của FE.
  output: 'standalone',
  // Monorepo: trace file từ gốc workspace, không phải từ thư mục app.
  outputFileTracingRoot: join(import.meta.dirname, '../..'),
  images: {
    // Ảnh sản phẩm nằm trên kho ngoài: LocalStack khi dev, R2 khi chạy thật.
    // Thiếu khai báo này next/image từ chối hiển thị.
    remotePatterns: [
      { protocol: 'http', hostname: '127.0.0.1', port: '4566', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '4566', pathname: '/**' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com', pathname: '/**' },
      ...(process.env.NEXT_PUBLIC_MEDIA_HOST
        ? [
            {
              protocol: 'https' as const,
              hostname: process.env.NEXT_PUBLIC_MEDIA_HOST,
              pathname: '/**',
            },
          ]
        : []),
    ],
  },
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
