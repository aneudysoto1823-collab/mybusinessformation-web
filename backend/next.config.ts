import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  outputFileTracingIncludes: {
    '/**': ['../*.html'],
  },import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    outputFileTracingRoot: require('path').join(__dirname, '../'),
  },
  outputFileTracingIncludes: {
    '/**': ['../*.html'],
  },
};

export default nextConfig;
};

export default nextConfig;