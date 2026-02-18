interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-3xl font-heading font-bold">{value}</p>
    </div>
  );
}

interface DashboardStatsProps {
  totalEvents: number;
  totalBookings: number;
  upcomingEvents: number;
}

export default function DashboardStats({ totalEvents, totalBookings, upcomingEvents }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard label="Total Events" value={totalEvents} icon="🗓️" />
      <StatCard label="Total Bookings" value={totalBookings} icon="🎟️" />
      <StatCard label="Upcoming Events" value={upcomingEvents} icon="🔜" />
    </div>
  );
}
