import type { NextConfig } from "next";

const nextConfig: NextConfig = {  
  images: {
    remotePatterns: [new URL('https://pbs.twimg.com/**')],
  },
};

export default nextConfig;
