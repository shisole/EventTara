interface ProfileStatsProps {
  totalEvents: number;
  badgeCount: number;
  typeBreakdown: Record<string, number>;
}

const typeLabels: Record<string, string> = {
  hiking: "Hikes",
  mtb: "MTB Rides",
  road_bike: "Road Rides",
  running: "Runs",
  trail_run: "Trail Runs",
};

export default function ProfileStats({ totalEvents, badgeCount, typeBreakdown }: ProfileStatsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-coral-500">{totalEvents}</p>
          <p className="text-sm text-gray-500">Events Joined</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-golden-500">{badgeCount}</p>
          <p className="text-sm text-gray-500">Badges Earned</p>
        </div>
      </div>

      {Object.keys(typeBreakdown).length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {Object.entries(typeBreakdown).map(([type, count]) => (
            <span key={type} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
              {count} {typeLabels[type] || type}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
