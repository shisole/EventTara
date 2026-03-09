import { redirect } from "next/navigation";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import ScannerFAB from "@/components/dashboard/ScannerFAB";
import { Breadcrumbs } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has management role in at least one club
  const { data: memberships } = await supabase
    .from("club_members")
    .select("club_id, role")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin", "moderator"]);

  if (!memberships?.length) {
    redirect("/events");
  }

  // Fetch club details for sidebar switcher
  const clubIds = memberships.map((m) => m.club_id);
  const { data: clubs } = await supabase
    .from("clubs")
    .select("id, name, slug, logo_url")
    .in("id", clubIds)
    .order("created_at", { ascending: false });

  const clubOptions = (clubs ?? []).map((club) => ({
    id: club.id,
    name: club.name,
    slug: club.slug,
    logo_url: club.logo_url,
    role: memberships.find((m) => m.club_id === club.id)?.role ?? "member",
  }));

  return (
    <div className="flex">
      <DashboardSidebar clubs={clubOptions} />
      <main className="flex-1 min-w-0 p-4 md:p-8 bg-gray-50 dark:bg-gray-950 min-h-[calc(100dvh-4rem)]">
        <Breadcrumbs />
        {children}
      </main>
      <ScannerFAB />
    </div>
  );
}
