import { notFound } from "next/navigation";

import ClubSettingsForm from "@/components/dashboard/ClubSettingsForm";
import OwnershipTransferSection from "@/components/dashboard/OwnershipTransferSection";
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

  const isOwner = membership?.role === "owner";

  // Get non-owner members for ownership transfer (only if owner)
  let transferableMembers: {
    user_id: string;
    full_name: string | null;
    username: string | null;
  }[] = [];
  if (isOwner) {
    const { data: members } = await supabase
      .from("club_members")
      .select("user_id, users(full_name, username)")
      .eq("club_id", club.id)
      .neq("role", "owner");

    transferableMembers = (members ?? []).map((m) => {
      const u = (Array.isArray(m.users) ? m.users[0] : m.users) as {
        full_name: string | null;
        username: string | null;
      } | null;
      return {
        user_id: m.user_id,
        full_name: u?.full_name ?? null,
        username: u?.username ?? null,
      };
    });
  }

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
        isOwner={isOwner}
      />

      {isOwner && transferableMembers.length > 0 && (
        <OwnershipTransferSection
          clubSlug={club.slug}
          clubName={club.name}
          members={transferableMembers}
        />
      )}
    </div>
  );
}
