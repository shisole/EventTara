import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function ClubDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch the club by slug
  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug, logo_url")
    .eq("slug", slug)
    .single();

  if (!club) notFound();

  // Verify user has management role in this club
  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .in("role", ["owner", "admin", "moderator"])
    .single();

  if (!membership) redirect("/dashboard");

  return <>{children}</>;
}
