import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { redirect } from "next/navigation";

import "./globals.css";
import AdminSidebar from "@/components/admin/AdminSidebar";
import ThemeProvider from "@/components/layout/ThemeProvider";
import { isAdminUser } from "@/lib/admin/auth";
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

export const metadata = {
  title: "Admin — EventTara",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user.id)) {
    redirect("/events");
  }

  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans min-h-dvh flex flex-col">
        <ThemeProvider>
          <div className="flex min-h-dvh">
            <AdminSidebar />
            <main className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-950">
              <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-4">
                <h1 className="font-heading font-bold text-lg text-gray-900 dark:text-white">
                  EventTara Admin
                </h1>
              </div>
              <div className="p-6">{children}</div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
