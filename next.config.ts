import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  trailingSlash: Boolean(process.env.NEXT_PUBLIC_BASE_PATH),
  allowedDevOrigins: ["127.0.0.1"],
  ...(process.env.NODE_ENV === "development" ? {
    async headers() {
      return [{ source: "/assets/motion/:path*", headers: [{ key: "Access-Control-Allow-Origin", value: "*" }] }];
    },
  } : {}),
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
    ],
  },
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
