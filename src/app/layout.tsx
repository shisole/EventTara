import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/lib/store/provider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "EventTara — Tara na! Book Your Next Adventure",
  description:
    "EventTara is an adventure event booking platform for hiking, mountain biking, road biking, running, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className="font-sans">
          <StoreProvider>
            <Navbar />
            <div className="pb-16 md:pb-0">
              {children}
            </div>
            <Footer />
            <MobileNav />
          </StoreProvider>
        </body>
    </html>
  );
}
