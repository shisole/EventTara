import { CheckCircleIcon, ExploreIcon, StarIcon, StravaIcon } from "@/components/icons";
import { getStravaShowcaseFlags, isComingSoonEnabled } from "@/lib/cms/cached";
import { createClient } from "@/lib/supabase/server";

import StravaShowcaseRouteMap from "./StravaShowcaseRouteMap";

const FEATURES = [
  {
    icon: ExploreIcon,
    title: "Route Maps",
    description:
      "Every event shows an interactive trail map so you know exactly where you're going.",
  },
  {
    icon: CheckCircleIcon,
    title: "Auto-Verify",
    description:
      "Link your Strava activities to confirm participation — no manual check-ins needed.",
  },
  {
    icon: StarIcon,
    title: "Track Stats",
    description: "Distance, elevation, and activity history tracked on your profile automatically.",
  },
];

async function fetchAggregateStats(): Promise<{
  totalDistanceKm: number;
  activitiesLinked: number;
  routesMapped: number;
}> {
  const supabase = await createClient();

  const [activitiesResult, routesResult] = await Promise.all([
    supabase.from("strava_activities").select("distance"),
    supabase.from("event_routes").select("id", { count: "exact", head: true }),
  ]);

  const activities = activitiesResult.data ?? [];
  const totalDistanceKm = Math.round(
    activities.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000,
  );

  return {
    totalDistanceKm,
    activitiesLinked: activities.length,
    routesMapped: routesResult.count ?? 0,
  };
}

export default async function StravaShowcaseSection() {
  const [flags, comingSoon] = await Promise.all([getStravaShowcaseFlags(), isComingSoonEnabled()]);
  const anyEnabled = flags.features || flags.stats || flags.routeMap;

  if (!anyEnabled) return null;

  const stats = flags.stats ? await fetchAggregateStats() : null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/60 to-white py-16 dark:from-orange-950/20 dark:to-gray-950 sm:py-20">
      <div className={comingSoon ? "pointer-events-none select-none blur-[6px]" : undefined}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FC4C02]/20 bg-[#FC4C02]/10 px-4 py-1.5 text-sm font-medium text-[#FC4C02]">
              <StravaIcon className="h-4 w-4" />
              Powered by Strava
            </div>
            <h2 className="font-heading text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Every Route, Tracked and Mapped
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              Connect your Strava account to track activities, verify participation, and explore
              interactive route maps on every event.
            </p>
          </div>

          {/* Feature highlights */}
          {flags.features && (
            <div className="mb-12 grid gap-6 sm:grid-cols-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#FC4C02]/10">
                    <feature.icon className="h-5 w-5 text-[#FC4C02]" />
                  </div>
                  <h3 className="mb-1 font-heading font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Live aggregate stats */}
          {flags.stats && stats && (
            <div className="mb-12 grid gap-6 sm:grid-cols-3">
              {[
                {
                  value: stats.totalDistanceKm.toLocaleString(),
                  unit: "km",
                  label: "Distance Tracked",
                },
                {
                  value: stats.activitiesLinked.toLocaleString(),
                  unit: "",
                  label: "Activities Linked",
                },
                { value: stats.routesMapped.toLocaleString(), unit: "", label: "Routes Mapped" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl font-bold text-[#FC4C02]">
                    {stat.value}
                    {stat.unit && (
                      <span className="ml-1 text-lg font-normal text-[#FC4C02]/70">
                        {stat.unit}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Visual route demo */}
          {flags.routeMap && (
            <div className="mb-8">
              <p className="mb-3 text-center text-sm text-gray-500 dark:text-gray-400">
                Iloilo–Miag-ao Coastal Road — 110 km cycling route
              </p>
              <StravaShowcaseRouteMap />
            </div>
          )}

          {/* CTA */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-lg bg-[#FC4C02] px-6 py-3 font-medium text-white">
              <ExploreIcon className="h-5 w-5" />
              Explore Events
            </div>
          </div>
        </div>
      </div>

      {comingSoon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl bg-white/90 px-8 py-5 shadow-lg backdrop-blur-sm dark:bg-gray-900/90">
            <div className="flex items-center gap-3">
              <StravaIcon className="h-6 w-6 text-[#FC4C02]" />
              <div>
                <p className="font-heading text-lg font-bold text-gray-900 dark:text-white">
                  Coming Soon
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Strava integration is on the way
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
