import AchievementsProgressSection, {
  type BadgeWithProgress,
} from "@/components/home/AchievementsProgressSection";
import { calculateBadgeProgress } from "@/lib/badges/calculate-progress";
import { createClient } from "@/lib/supabase/server";

interface HomeAchievementsProps {
  userId: string;
}

export default async function HomeAchievements({ userId }: HomeAchievementsProps) {
  const supabase = await createClient();

  const [badgesResult, userBadgesResult] = await Promise.all([
    supabase.from("badges").select("*").eq("type", "system"),
    supabase.from("user_badges").select("badge_id").eq("user_id", userId),
  ]);

  const badges = badgesResult.data ?? [];
  const earnedBadgeIds = new Set((userBadgesResult.data ?? []).map((ub) => ub.badge_id));

  const unearnedBadges = badges.filter((b) => !earnedBadgeIds.has(b.id));
  const progressResults = await Promise.all(
    unearnedBadges.map((b) =>
      calculateBadgeProgress(userId, b as Parameters<typeof calculateBadgeProgress>[1], supabase),
    ),
  );

  const inProgressBadges = unearnedBadges
    .map((b, i) => ({
      id: b.id,
      title: b.title,
      image_url: b.image_url,
      rarity: (b.rarity ?? "common") as string,
      progress: progressResults[i],
    }))
    .filter((b): b is BadgeWithProgress => b.progress !== null && b.progress.percent > 0)
    .sort((a, b) => b.progress.percent - a.progress.percent)
    .slice(0, 3);

  if (inProgressBadges.length === 0) return null;

  return <AchievementsProgressSection badges={inProgressBadges} />;
}
