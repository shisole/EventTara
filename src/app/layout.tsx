import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/lib/store/provider";
import ThemeProvider from "@/components/layout/ThemeProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import SplashScreen from "@/components/layout/SplashScreen";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://eventtara.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "EventTara — Tara na! Book Your Next Adventure",
    template: "%s — EventTara",
  },
  description:
    "EventTara is an adventure event booking platform for hiking, mountain biking, road biking, running, and more. Tara na!",
  keywords: [
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
  authors: [{ name: "EventTara" }],
  openGraph: {
    type: "website",
    siteName: "EventTara",
    title: "EventTara — Tara na! Book Your Next Adventure",
    description:
      "Discover and book outdoor adventures — hiking, biking, running, and more. Tara na!",
    locale: "en_PH",
  },
  twitter: {
    card: "summary_large_image",
    title: "EventTara — Tara na! Book Your Next Adventure",
    description:
      "Discover and book outdoor adventures — hiking, biking, running, and more. Tara na!",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`} suppressHydrationWarning>
      <body className="font-sans min-h-screen flex flex-col">
          <ThemeProvider>
            <StoreProvider>
              <SplashScreen />
              <Navbar />
              <div className="flex-1 pb-16 md:pb-0">
                {children}
              </div>
              <Footer />
              <MobileNav />
            </StoreProvider>
          </ThemeProvider>
        </body>
    </html>
  );
}
