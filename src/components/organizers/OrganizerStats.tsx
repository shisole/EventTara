interface OrganizerStatsProps {
  totalEvents: number;
  totalParticipants: number;
  totalBadgesAwarded: number;
  avgRating?: number;
  totalReviews?: number;
}

export default function OrganizerStats({
  totalEvents,
  totalParticipants,
  totalBadgesAwarded,
  avgRating,
  totalReviews,
}: OrganizerStatsProps) {
  const stats: { value: string | number; label: string }[] = [
    { value: totalEvents, label: "Events Hosted" },
    { value: totalParticipants, label: "Participants" },
    { value: totalBadgesAwarded, label: "Badges Awarded" },
  ];

  if (totalReviews && totalReviews > 0 && avgRating !== undefined) {
    stats.push({
      value: `${avgRating.toFixed(1)} \u2605`,
      label: `${totalReviews} Review${totalReviews === 1 ? "" : "s"}`,
    });
  }

  const cols = stats.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3";

  return (
    <div className={`grid ${cols} gap-4`}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 text-center"
        >
          <p className="text-2xl font-bold text-lime-600 dark:text-lime-400">{stat.value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
