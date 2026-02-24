import { withPayload } from "@payloadcms/next/withPayload";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : "**.supabase.co";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
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
    ],
  },
  async rewrites() {
    /** @type {import('next').Rewrite[]} */
    const rules = [
      // Payload CMS media: serve from public/media/ instead of Payload API
      {
        source: "/api/media/file/:path*",
        destination: "/media/:path*",
      },
    ];
    if (supabaseUrl) {
      rules.push({
        source: "/storage/:path*",
        destination: `${supabaseUrl}/storage/v1/object/public/:path*`,
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
    ];
  },
};

export default withPayload(nextConfig);
