import type { Metadata } from "next";
import { Dancing_Script, Inter, Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import ClientShell from "@/components/layout/ClientShell";
import Footer from "@/components/layout/Footer";
import ThemeProvider from "@/components/layout/ThemeProvider";
import { getCachedActivityTypes } from "@/lib/activity-types/cached";
import {
  getCachedFeatureFlags,
  getCachedHeroCarousel,
  getCachedSiteSettings,
  isActivityFeedEnabled,
  parseHeroSlides,
} from "@/lib/cms/cached";
import { type BorderTier } from "@/lib/constants/avatar-borders";
import { createClient } from "@/lib/supabase/server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-cursive",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getCachedSiteSettings();

  const siteName = settings?.site_name || "EventTara";
  const tagline = settings?.tagline || "Tara na! Book Your Next Adventure";
  const siteDescription =
    settings?.site_description ||
    "EventTara is an adventure event booking platform for hiking, mountain biking, road biking, running, and more. Tara na!";
  const siteUrl = settings?.site_url || process.env.NEXT_PUBLIC_SITE_URL || "https://eventtara.com";
  const defaultTitle = `${siteName} — ${tagline}`;

  return {
    metadataBase: new URL(siteUrl),
    other: { "fb:app_id": "2075920046597865" },
    title: {
      default: defaultTitle,
      template: settings?.seo_title_template || "%s — EventTara",
    },
    description: siteDescription,
    keywords: settings?.seo_keywords?.split(",").map((k) => k.trim()) || [
      "events",
      "adventure",
      "hiking",
      "mountain biking",
      "road biking",
      "running",
      "trail running",
      "Philippines",
      "outdoor",
      "booking",
    ],
    authors: [{ name: siteName }],
    openGraph: {
      type: "website",
      siteName: siteName,
      title: defaultTitle,
      description: siteDescription,
      url: siteUrl,
      locale: settings?.seo_og_locale || "en_PH",
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: siteDescription,
    },
    manifest: "/site.webmanifest",
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
        { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
        { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
        { url: "/favicon-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const [settings, activityFeedEnabled, featureFlags, heroCarousel, activityTypes, authResult] =
    await Promise.all([
      getCachedSiteSettings(),
      isActivityFeedEnabled(),
      getCachedFeatureFlags(),
      getCachedHeroCarousel(),
      getCachedActivityTypes(),
      supabase.auth.getUser(),
    ]);
  const navLayout = settings?.nav_layout || "strip";

  const currentUser = authResult.data.user;
  let initialRole: string | null = null;
  let initialCanManage = false;
  let initialActiveBorder: { id: string; tier: BorderTier; color: string | null } | null = null;

  if (currentUser) {
    const [userData, memberships] = await Promise.all([
      supabase.from("users").select("role, active_border_id").eq("id", currentUser.id).single(),
      supabase
        .from("club_members")
        .select("id")
        .eq("user_id", currentUser.id)
        .in("role", ["owner", "admin", "moderator"])
        .limit(1),
    ]);
    initialRole = userData.data?.role ?? null;
    initialCanManage = (memberships.data?.length ?? 0) > 0;

    if (userData.data?.active_border_id) {
      const { data: border } = await supabase
        .from("avatar_borders")
        .select("tier, border_color")
        .eq("id", userData.data.active_border_id)
        .single();
      if (border) {
        initialActiveBorder = {
          id: userData.data.active_border_id,
          tier: border.tier as BorderTier,
          color: border.border_color,
        };
      }
    }
  }
  const isProduction = (process.env.VERCEL_ENV ?? process.env.NODE_ENV) === "production";
  const adminUserIds = (
    isProduction
      ? (process.env.ADMIN_USER_IDS ?? "")
      : [process.env.ADMIN_USER_IDS, process.env.ADMIN_DEV_STAGING_USER_IDS]
          .filter(Boolean)
          .join(",")
  )
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable} ${dancingScript.variable}`}
      suppressHydrationWarning
    >
      <head>
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <>
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
            <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
          </>
        )}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: settings?.site_name || "EventTara",
                  url:
                    settings?.site_url ||
                    process.env.NEXT_PUBLIC_SITE_URL ||
                    "https://eventtara.com",
                  logo: `${settings?.site_url || process.env.NEXT_PUBLIC_SITE_URL || "https://eventtara.com"}/favicon-512x512.png`,
                  description:
                    settings?.site_description ||
                    "EventTara is an adventure event booking platform for hiking, mountain biking, road biking, running, and more.",
                  sameAs: [],
                },
                {
                  "@type": "WebSite",
                  name: settings?.site_name || "EventTara",
                  url:
                    settings?.site_url ||
                    process.env.NEXT_PUBLIC_SITE_URL ||
                    "https://eventtara.com",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate: `${settings?.site_url || process.env.NEXT_PUBLIC_SITE_URL || "https://eventtara.com"}/events?search={search_term_string}`,
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="font-sans min-h-dvh flex flex-col">
        <GoogleAnalytics />
        <ThemeProvider>
          <ClientShell
            initialNavLayout={navLayout}
            activityFeedEnabled={activityFeedEnabled}
            adminUserIds={adminUserIds}
            featureFlags={featureFlags}
            siteSettings={
              settings
                ? {
                    site_name: settings.site_name,
                    tagline: settings.tagline,
                    nav_layout: settings.nav_layout,
                  }
                : null
            }
            heroSlideCount={parseHeroSlides(heroCarousel).length}
            activityTypes={activityTypes.map((at) => ({
              slug: at.slug,
              label: at.label,
              icon: at.icon,
              image: at.image_url,
            }))}
            initialUser={currentUser}
            initialRole={initialRole}
            initialCanManage={initialCanManage}
            initialActiveBorder={initialActiveBorder}
          >
            {children}
          </ClientShell>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
