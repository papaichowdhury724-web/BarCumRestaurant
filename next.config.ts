import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // ship only the framer-motion parts that are actually used
    optimizePackageImports: ["framer-motion"],
  },
  async headers() {
    return [
      {
        // static grain tile never changes: let phones cache it for a year
        source: "/noise.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
