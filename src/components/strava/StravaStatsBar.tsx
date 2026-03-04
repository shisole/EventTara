import { StravaIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface StravaAthleteTotal {
  count: number;
  distance: number;
  moving_time: number;
  elevation_gain: number;
}

interface StravaStatsData {
  recent_run_totals?: StravaAthleteTotal;
  recent_ride_totals?: StravaAthleteTotal;
  ytd_run_totals?: StravaAthleteTotal;
  ytd_ride_totals?: StravaAthleteTotal;
  all_run_totals?: StravaAthleteTotal;
  all_ride_totals?: StravaAthleteTotal;
}

interface StravaStatsBarProps {
  /** The athlete_data JSONB blob from strava_connections */
  athleteData: Record<string, unknown> | null;
  /** Pre-fetched athlete stats (from Strava API /athletes/:id/stats) */
  stats?: StravaStatsData | null;
  /** Strava athlete ID — used to link to the Strava profile */
  stravaAthleteId?: number | null;
  className?: string;
}

function isValidTotal(value: unknown): value is StravaAthleteTotal {
  if (typeof value !== "object" || value === null) return false;
  return (
    "count" in value &&
    typeof value.count === "number" &&
    "distance" in value &&
    typeof value.distance === "number"
  );
}

function parseStatsData(data: Record<string, unknown> | null): StravaStatsData | null {
  if (!data) return null;
  // Check if the data looks like it has stats keys
  if ("all_run_totals" in data || "all_ride_totals" in data || "recent_run_totals" in data) {
    const result: StravaStatsData = {};
    if (isValidTotal(data.all_run_totals)) result.all_run_totals = data.all_run_totals;
    if (isValidTotal(data.all_ride_totals)) result.all_ride_totals = data.all_ride_totals;
    if (isValidTotal(data.recent_run_totals)) result.recent_run_totals = data.recent_run_totals;
    if (isValidTotal(data.recent_ride_totals)) result.recent_ride_totals = data.recent_ride_totals;
    return result;
  }
  return null;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(0)} km`;
  }
  return `${Math.round(meters)} m`;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  if (hours >= 1) {
    return `${String(hours)}h`;
  }
  return `${String(Math.floor(seconds / 60))}m`;
}

export default function StravaStatsBar({
  athleteData,
  stats,
  stravaAthleteId,
  className,
}: StravaStatsBarProps) {
  // Extract stats: prefer pre-fetched stats, then try athlete_data
  const statsSource: StravaStatsData | null = stats ?? parseStatsData(athleteData);

  // Compute aggregated totals from all-time run + ride totals
  let totalDistance = 0;
  let totalActivities = 0;
  let totalTime = 0;
  let totalElevation = 0;
  let hasStats = false;

  if (statsSource) {
    const allRun = statsSource.all_run_totals;
    const allRide = statsSource.all_ride_totals;

    if (isValidTotal(allRun)) {
      totalDistance += allRun.distance;
      totalActivities += allRun.count;
      totalTime += allRun.moving_time;
      totalElevation += allRun.elevation_gain;
      hasStats = true;
    }
    if (isValidTotal(allRide)) {
      totalDistance += allRide.distance;
      totalActivities += allRide.count;
      totalTime += allRide.moving_time;
      totalElevation += allRide.elevation_gain;
      hasStats = true;
    }
  }

  // Compute recent (last 4 weeks) totals
  let recentActivities = 0;
  if (statsSource) {
    const recentRun = statsSource.recent_run_totals;
    const recentRide = statsSource.recent_ride_totals;
    if (isValidTotal(recentRun)) recentActivities += recentRun.count;
    if (isValidTotal(recentRide)) recentActivities += recentRide.count;
  }

  // Build athlete name from athleteData for display
  const athleteName =
    athleteData && typeof athleteData.firstname === "string"
      ? `${athleteData.firstname}${typeof athleteData.lastname === "string" ? ` ${athleteData.lastname}` : ""}`
      : null;

  const stravaProfileUrl = stravaAthleteId
    ? `https://www.strava.com/athletes/${String(stravaAthleteId)}`
    : null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#FC4C02]/20 bg-gradient-to-r from-orange-50 to-white dark:from-orange-950/20 dark:to-gray-900 p-5",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <StravaIcon className="w-5 h-5 text-[#FC4C02]" />
          {athleteName && stravaProfileUrl ? (
            <a
              href={stravaProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[#FC4C02] transition-colors"
            >
              {athleteName}
            </a>
          ) : (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Strava Connected
            </span>
          )}
        </div>
        <a
          href="https://www.strava.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-[#FC4C02] transition-colors"
        >
          Powered by
          <StravaIcon className="w-3.5 h-3.5" />
          Strava
        </a>
      </div>

      {/* Stats grid */}
      {hasStats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-lg font-bold text-[#FC4C02]">{formatDistance(totalDistance)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Distance</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[#FC4C02]">{totalActivities}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Activities</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[#FC4C02]">{formatTime(totalTime)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Moving Time</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[#FC4C02]">{Math.round(totalElevation)}m</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Elevation Gain</p>
          </div>
        </div>
      ) : (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          No Strava stats available yet. Go log some activities!
        </p>
      )}

      {/* Recent activity count (if available) */}
      {recentActivities > 0 && (
        <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
          {recentActivities} activit{recentActivities === 1 ? "y" : "ies"} in the last 4 weeks
        </p>
      )}
    </div>
  );
}
