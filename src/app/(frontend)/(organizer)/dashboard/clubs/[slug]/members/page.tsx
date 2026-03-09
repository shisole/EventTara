import { notFound } from "next/navigation";

import ClubMembersList from "@/components/dashboard/ClubMembersList";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: club } = await supabase.from("clubs").select("name").eq("slug", slug).single();
  return { title: club ? `Members — ${club.name}` : "Members" };
}

export default async function ClubMembersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!club) notFound();

  // Get current user's role in this club
  const { data: currentMembership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", club.id)
    .eq("user_id", user!.id)
    .single();

  // Fetch all members with user data
  const { data: members } = await supabase
    .from("club_members")
    .select("id, club_id, user_id, role, joined_at, users(id, full_name, username, avatar_url)")
    .eq("club_id", club.id)
    .order("joined_at", { ascending: true });

  // Sort by role hierarchy
  const roleOrder: Record<string, number> = {
    owner: 0,
    admin: 1,
    moderator: 2,
    member: 3,
  };

  const sortedMembers = (members ?? [])
    .map((m) => {
      const user = Array.isArray(m.users) ? m.users[0] : m.users;
      return {
        id: m.id,
        club_id: m.club_id,
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        user: user ?? null,
      };
    })
    .sort((a, b) => {
      const ra = roleOrder[a.role] ?? 99;
      const rb = roleOrder[b.role] ?? 99;
      if (ra !== rb) return ra - rb;
      return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold dark:text-white">Members</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {sortedMembers.length} member{sortedMembers.length === 1 ? "" : "s"}
        </span>
      </div>

      <ClubMembersList
        members={sortedMembers as any}
        clubSlug={club.slug}
        currentUserRole={currentMembership?.role ?? "member"}
      />
    </div>
  );
}
