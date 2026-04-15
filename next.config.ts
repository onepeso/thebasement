import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // 1. Enable Static Export
  output: "export",

  // 2. Mandatory for static exports in Next.js
  images: {
    unoptimized: true,
  },

  turbopack: {
    root: path.resolve(__dirname),
  },
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
