import { getActivityPluralLabel, getActivityStatsColor } from "@/lib/constants/activity-types";

interface ProfileStatsProps {
  totalEvents: number;
  badgeCount: number;
  typeBreakdown: Record<string, number>;
}

export default function ProfileStats({
  totalEvents,
  badgeCount,
  typeBreakdown,
}: ProfileStatsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-lime-50 dark:bg-lime-950/30 border border-lime-200 dark:border-lime-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-lime-600 dark:text-lime-400">{totalEvents}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Events Joined</p>
        </div>
        <div className="bg-golden-50 dark:bg-golden-950/30 border border-golden-200 dark:border-golden-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-golden-500">{badgeCount}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Badges Earned</p>
        </div>
      </div>

      {Object.keys(typeBreakdown).length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {Object.entries(typeBreakdown)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([type, count]) => (
              <span
                key={type}
                className={`px-3 py-1 rounded-full text-sm font-medium ${getActivityStatsColor(type)}`}
              >
                {count} {getActivityPluralLabel(type)}
              </span>
            ))}
          {Object.keys(typeBreakdown).length > 3 && (
            <span className="px-3 py-1 rounded-full text-sm text-gray-500 dark:text-gray-400">
              +{Object.keys(typeBreakdown).length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
