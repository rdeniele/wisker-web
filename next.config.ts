import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    // Increase server actions body size limit to 50MB for file uploads
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
