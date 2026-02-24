import { redirect } from "next/navigation";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();

  if (profile?.role !== "organizer") {
    redirect("/events");
  }

  return (
    <div className="flex">
      <DashboardSidebar />
      <main className="flex-1 p-6 md:p-8 bg-gray-50 dark:bg-gray-950 min-h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  );
}
