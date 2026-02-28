import type { Metadata } from "next";
import { Dancing_Script, Inter, Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import ClientShell from "@/components/layout/ClientShell";
import Footer from "@/components/layout/Footer";
import ThemeProvider from "@/components/layout/ThemeProvider";
import { getCachedSiteSettings } from "@/lib/payload/cached";

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

  const siteName = settings?.siteName || "EventTara";
  const tagline = settings?.tagline || "Tara na! Book Your Next Adventure";
  const siteDescription =
    settings?.siteDescription ||
    "EventTara is an adventure event booking platform for hiking, mountain biking, road biking, running, and more. Tara na!";
  const siteUrl = settings?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://eventtara.com";
  const defaultTitle = `${siteName} — ${tagline}`;

  return {
    metadataBase: new URL(siteUrl),
    other: { "fb:app_id": "2075920046597865" },
    title: {
      default: defaultTitle,
      template: settings?.seo?.titleTemplate || "%s — EventTara",
    },
    description: siteDescription,
    keywords: settings?.seo?.keywords?.split(",").map((k: string) => k.trim()) || [
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
      locale: settings?.seo?.ogLocale || "en_PH",
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
  const settings = await getCachedSiteSettings();
  const navLayout = (settings?.navLayout as string) || "strip";

  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable} ${dancingScript.variable}`}
      suppressHydrationWarning
    >
      <head>
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        )}
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body className="font-sans min-h-screen flex flex-col">
        <GoogleAnalytics />
        <ThemeProvider>
          <ClientShell initialNavLayout={navLayout}>{children}</ClientShell>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
