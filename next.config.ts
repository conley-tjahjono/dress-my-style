import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@supabase/ssr'],
  // Ensure proper module resolution for deployment
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle server-side module resolution
      config.resolve.extensionAlias = {
        ".js": [".js", ".ts", ".tsx"],
        ".jsx": [".jsx", ".tsx"],
      }
    }
    return config
  }
};

export default nextConfig;
