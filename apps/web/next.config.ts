import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@7even/core"],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
