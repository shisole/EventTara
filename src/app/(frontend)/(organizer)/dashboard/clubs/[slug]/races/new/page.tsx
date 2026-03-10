import { notFound, redirect } from "next/navigation";

import CreateRaceForm from "@/components/dashboard/CreateRaceForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewRacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();
  if (!club) notFound();

  // Check permission
  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    redirect(`/dashboard/clubs/${slug}`);
  }

  // Fetch badges for dropdown
  const { data: badges } = await supabase
    .from("badges")
    .select("id, title, image_url")
    .order("title");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold dark:text-white">New Duck Race</h1>
      <CreateRaceForm clubSlug={club.slug} badges={badges ?? []} />
    </div>
  );
}
