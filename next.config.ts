import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
        pathname: "/b/id/**",
      },
    ],
    // Book covers are static; keep optimized copies warm across refreshes.
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
};

export default nextConfig;
