import { type Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import ForumTab from "@/components/clubs/forum/ForumTab";
import { type ClubRole } from "@/lib/clubs/types";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase.from("clubs").select("name").eq("slug", slug).single();

  return {
    title: club ? `${club.name} Forum -- EventTara` : "Forum Not Found",
  };
}

export default async function ForumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/clubs/${slug}/forum`);
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

  const userRole = membership.role as ClubRole;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-5">
      <div>
        <Link
          href={`/clubs/${club.slug}`}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          &larr; {club.name}
        </Link>
        <h1 className="text-2xl font-heading font-bold mt-1 dark:text-white">Forum</h1>
      </div>

      <ForumTab clubId={club.id} clubSlug={club.slug} userRole={userRole} />
    </div>
  );
}
