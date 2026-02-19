interface OrganizerStatsProps {
  totalEvents: number;
  totalParticipants: number;
  totalBadgesAwarded: number;
}

export default function OrganizerStats({
  totalEvents,
  totalParticipants,
  totalBadgesAwarded,
}: OrganizerStatsProps) {
  const stats = [
    { value: totalEvents, label: "Events Hosted" },
    { value: totalParticipants, label: "Participants" },
    { value: totalBadgesAwarded, label: "Badges Awarded" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 text-center"
        >
          <p className="text-2xl font-bold text-lime-600 dark:text-lime-400">
            {stat.value}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
