"use client";

import dynamic from "next/dynamic";

const Navbar = dynamic(() => import("@/components/layout/Navbar"), {
  ssr: false,
  loading: () => (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <span className="text-2xl font-heading font-bold text-lime-500">EventTara</span>
        </div>
      </div>
    </nav>
  ),
});
const MobileNav = dynamic(() => import("@/components/layout/MobileNav"), { ssr: false });

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="flex-1 pb-16 md:pb-0">{children}</div>
      <MobileNav />
    </>
  );
}
