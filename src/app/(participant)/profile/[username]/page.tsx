import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import BadgeGrid from "@/components/badges/BadgeGrid";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("full_name")
    .eq("username", username)
    .single();

  if (!user) return { title: "Profile Not Found — EventTara" };
  return {
    title: `${user.full_name} — EventTara Adventurer`,
    description: `Check out ${user.full_name}'s adventure profile and badges on EventTara!`,
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (!user) notFound();

  // Get user badges with event info
  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("awarded_at, badges(title, image_url, events(title))")
    .eq("user_id", user.id)
    .order("awarded_at", { ascending: false });

  // Get booking history for stats
  const { data: bookings } = await supabase
    .from("bookings")
    .select("events(type)")
    .eq("user_id", user.id)
    .in("status", ["confirmed", "pending"]);

  const totalEvents = bookings?.length || 0;
  const badgeCount = userBadges?.length || 0;

  // Type breakdown
  const typeBreakdown: Record<string, number> = {};
  bookings?.forEach((b: any) => {
    const type = b.events?.type;
    if (type) typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
  });

  // Format badges for BadgeGrid
  const badges = (userBadges || []).map((ub: any) => ({
    title: ub.badges?.title || "Badge",
    eventName: ub.badges?.events?.title || "Event",
    imageUrl: ub.badges?.image_url || null,
    awardedAt: ub.awarded_at,
  }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">
      <ProfileHeader
        fullName={user.full_name}
        username={user.username}
        avatarUrl={user.avatar_url}
        createdAt={user.created_at}
      />

      <ProfileStats
        totalEvents={totalEvents}
        badgeCount={badgeCount}
        typeBreakdown={typeBreakdown}
      />

      <div>
        <h2 className="text-xl font-heading font-bold mb-4 text-center">Badge Collection</h2>
        <BadgeGrid badges={badges} />
      </div>

      <div className="text-center pt-6 border-t border-gray-100">
        <p className="text-gray-500 mb-3">Want to earn badges too?</p>
        <Link href="/signup">
          <Button>Join EventTara</Button>
        </Link>
      </div>
    </div>
  );
}
