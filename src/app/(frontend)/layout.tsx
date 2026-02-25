import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

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
      locale: settings?.seo?.ogLocale || "en_PH",
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: siteDescription,
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable}`}
      suppressHydrationWarning
    >
      <GoogleAnalytics />
      <body className="font-sans min-h-screen flex flex-col">
        <ThemeProvider>
          <ClientShell>{children}</ClientShell>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
