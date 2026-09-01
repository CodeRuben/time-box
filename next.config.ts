import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Isolated verify instances cannot share `.next/dev/lock` with `pnpm dev` on :3000.
  distDir: process.env.TIME_BOX_VERIFY_RUN_ID
    ? `.next-verify/${process.env.TIME_BOX_VERIFY_RUN_ID}`
    : ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
        pathname: "/b/id/**",
      },
      {
        protocol: "https",
        hostname: "a.espncdn.com",
        pathname: "/i/headshots/**",
      },
      {
        protocol: "https",
        hostname: "a.espncdn.com",
        pathname: "/i/teamlogos/**",
      },
    ],
    // Book covers are static; keep optimized copies warm across refreshes.
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
};

export default nextConfig;
