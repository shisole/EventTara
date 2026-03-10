import { type Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import ForumThreadDetail from "@/components/clubs/forum/ForumThreadDetail";
import { type ClubRole } from "@/lib/clubs/types";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; threadId: string }>;
}): Promise<Metadata> {
  const { slug, threadId } = await params;
  const supabase = await createClient();

  const { data: thread } = await supabase
    .from("club_forum_threads")
    .select("title")
    .eq("id", threadId)
    .single();

  const { data: club } = await supabase.from("clubs").select("name").eq("slug", slug).single();

  return {
    title: thread ? `${thread.title} -- ${club?.name ?? "Club"} Forum` : "Thread Not Found",
  };
}

export default async function ForumThreadPage({
  params,
}: {
  params: Promise<{ slug: string; threadId: string }>;
}) {
  const { slug, threadId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/clubs/${slug}/forum/${threadId}`);
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!club) notFound();

  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .single();

  if (!membership) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <ForumThreadDetail
        clubSlug={club.slug}
        clubName={club.name}
        threadId={threadId}
        userId={user.id}
        userRole={membership.role as ClubRole}
      />
    </div>
  );
}
