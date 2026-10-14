import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'thaya-projects.s3.sa-east-1.amazonaws.com',
        pathname: '/grano-rey/productos/**',
      },
    ],
  },
};

export default nextConfig;
