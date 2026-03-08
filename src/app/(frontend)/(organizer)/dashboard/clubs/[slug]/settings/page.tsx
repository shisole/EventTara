import { notFound } from "next/navigation";

import ClubSettingsForm from "@/components/dashboard/ClubSettingsForm";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: club } = await supabase.from("clubs").select("name").eq("slug", slug).single();
  return { title: club ? `Settings — ${club.name}` : "Club Settings" };
}

export default async function ClubSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: club } = await supabase.from("clubs").select("*").eq("slug", slug).single();

  if (!club) notFound();

  // Get current user's role
  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", club.id)
    .eq("user_id", user!.id)
    .single();

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-heading font-bold dark:text-white">Club Settings</h1>

      <ClubSettingsForm
        club={{
          id: club.id,
          slug: club.slug,
          name: club.name,
          description: club.description,
          logo_url: club.logo_url,
          cover_url: club.cover_url,
          activity_types: club.activity_types,
          visibility: club.visibility,
          location: club.location,
          payment_info: (club.payment_info as Record<string, unknown>) ?? null,
        }}
        isOwner={membership?.role === "owner"}
      />
    </div>
  );
}
