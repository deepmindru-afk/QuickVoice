import type { NextConfig } from "next";

const DEFAULT_CONSOLE_URL = "https://console.quickvoice.co";
const consoleUrl =
  process.env.NEXT_PUBLIC_CONSOLE_URL?.replace(/\/+$/, "") ||
  DEFAULT_CONSOLE_URL;

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d35j3mps666d98.cloudfront.net",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/register",
        destination: `${consoleUrl}/register`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
