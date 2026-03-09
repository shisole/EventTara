import { notFound } from "next/navigation";

import ClubInvitesList from "@/components/dashboard/ClubInvitesList";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: club } = await supabase.from("clubs").select("name").eq("slug", slug).single();
  return { title: club ? `Invites — ${club.name}` : "Invites" };
}

export default async function ClubInvitesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!club) notFound();

  // Fetch existing invites
  const { data: invites } = await supabase
    .from("club_invites")
    .select("id, invite_code, max_uses, uses, expires_at, created_at")
    .eq("club_id", club.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold dark:text-white">Invite Links</h1>

      <ClubInvitesList clubSlug={club.slug} clubId={club.id} initialInvites={invites ?? []} />
    </div>
  );
}
