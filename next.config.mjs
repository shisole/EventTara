import { spawnSync } from "node:child_process";

import withSerwistInit from "@serwist/next";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ??
  crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  disable: process.env.NODE_ENV === "development",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : "**.supabase.co";
const r2PublicUrl = process.env.R2_PUBLIC_URL || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // CI runs lint separately; skip during build
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ["fluent-ffmpeg", "@ffmpeg-installer/ffmpeg"],
  experimental: {
    optimizeCss: true,
    serverActions: {
      bodySizeLimit: "200mb",
    },
  },
  images: {
    deviceSizes: [640, 828, 1200, 1440, 1920],
    imageSizes: [64, 128, 256, 384],
    qualities: [35, 60, 75],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Google user profile photos
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // Strava CDN (athlete profile photos)
      {
        protocol: "https",
        hostname: "dgalywyr863hv.cloudfront.net",
      },
      // Cloudflare R2 public bucket
      ...(r2PublicUrl
        ? [{ protocol: "https", hostname: new URL(r2PublicUrl).hostname }]
        : [{ protocol: "https", hostname: "pub-*.r2.dev" }]),
    ],
  },
  async rewrites() {
    /** @type {import('next').Rewrite[]} */
    const rules = [];
    if (supabaseUrl) {
      rules.push({
        source: "/storage/:path*",
        destination: `${supabaseUrl}/storage/v1/object/public/:path*`,
      });
    }
    if (r2PublicUrl) {
      rules.push({
        source: "/r2/:path*",
        destination: `${r2PublicUrl}/:path*`,
      });
    }
    return rules;
  },
  async headers() {
    return [
      {
        source: "/storage/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/r2/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/media/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
