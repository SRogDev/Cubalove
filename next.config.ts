import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,

  images: {
    loader: "custom",
    loaderFile: "./lib/cloudflare-image-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.digitaloceanspaces.com",
      },
      {
        protocol: "https",
        hostname: "cdn.datingcuba.com",
      },
      {
        protocol: "https",
        hostname: "supabase.datingcuba.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), camera=(), microphone=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://us.i.posthog.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.digitaloceanspaces.com https://cdn.datingcuba.com https://supabase.datingcuba.com https://lh3.googleusercontent.com",
              "font-src 'self'",
              "connect-src 'self' https://supabase.datingcuba.com wss://supabase.datingcuba.com https://us.i.posthog.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
