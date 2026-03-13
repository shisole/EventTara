import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import OnboardingQuizCard from "@/components/onboarding/OnboardingQuizCard";
import { RARITY_STYLES } from "@/lib/constants/badge-rarity";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Welcome",
};

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [userResult, badgesResult, totalBadgesResult] = await Promise.all([
    supabase.from("users").select("full_name, avatar_url").eq("id", user.id).single(),
    supabase
      .from("user_badges")
      .select("awarded_at, badges:badge_id(id, title, image_url, rarity)")
      .eq("user_id", user.id)
      .order("awarded_at", { ascending: false })
      .limit(8),
    supabase.from("badges").select("id", { count: "exact", head: true }),
  ]);

  const profile = userResult.data;
  const badges = (badgesResult.data ?? []).map((ub) => {
    const b = ub.badges as unknown as {
      id: string;
      title: string;
      image_url: string | null;
      rarity: keyof typeof RARITY_STYLES;
    };
    return { ...b, awarded_at: ub.awarded_at };
  });
  const totalBadgeCount = totalBadgesResult.count ?? 0;
  const remainingBadges = Math.max(0, totalBadgeCount - badges.length);

  const firstName = profile?.full_name?.split(" ")[0] ?? "Adventurer";
  const initials = (profile?.full_name ?? "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Avatar */}
        <div className="flex justify-center animate-fadeUp" style={{ animationDelay: "0ms" }}>
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name ?? "Avatar"}
              width={128}
              height={128}
              className="w-28 h-28 rounded-full object-cover ring-4 ring-lime-300 dark:ring-lime-700 shadow-lg"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-lime-100 dark:bg-lime-900 text-lime-600 dark:text-lime-300 flex items-center justify-center text-3xl font-bold ring-4 ring-lime-300 dark:ring-lime-700 shadow-lg">
              {initials}
            </div>
          )}
        </div>

        {/* Heading */}
        <div className="space-y-2 animate-fadeUp" style={{ animationDelay: "100ms" }}>
          <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-white">
            Welcome to EventTara, {firstName}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400">You&apos;re ready to adventure.</p>
        </div>

        {/* Badges */}
        {badges.length > 0 ? (
          <div className="space-y-4 animate-fadeUp" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                You unlocked
              </span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {badges.map((badge, i) => {
                const rarity = RARITY_STYLES[badge.rarity] ?? RARITY_STYLES.common;
                const isEmoji = badge.image_url && !badge.image_url.startsWith("http");

                return (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center gap-1.5 w-20 animate-fadeUp"
                    style={{ animationDelay: `${300 + i * 80}ms` }}
                  >
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700 ${rarity.glow}`}
                    >
                      {isEmoji ? (
                        <span className="text-2xl">{badge.image_url}</span>
                      ) : badge.image_url ? (
                        <Image
                          src={badge.image_url}
                          alt={badge.title}
                          width={40}
                          height={40}
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <span className="text-2xl">🏅</span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 leading-tight line-clamp-2">
                      {badge.title}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${rarity.pill}`}>
                      {rarity.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {remainingBadges > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                +{remainingBadges} more badges to earn
              </p>
            )}
          </div>
        ) : (
          <div className="animate-fadeUp" style={{ animationDelay: "200ms" }}>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Complete events to earn badges and climb the leaderboard!
            </p>
          </div>
        )}

        {/* Onboarding quiz (optional, dismissible) */}
        <div className="animate-fadeUp text-left" style={{ animationDelay: "400ms" }}>
          <OnboardingQuizCard firstName={firstName} />
        </div>

        {/* CTA */}
        <div className="animate-fadeUp" style={{ animationDelay: "500ms" }}>
          <Link
            href="/events"
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-semibold py-3.5 px-6 text-base transition-colors shadow-md"
          >
            Start Exploring
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
