import Link from "next/link";

import { Avatar } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export default async function OrganizersSection() {
  const supabase = await createClient();

  const { data: organizers } = await supabase
    .from("organizer_profiles")
    .select("id, org_name, logo_url, events!inner(id)")
    .eq("events.status", "published")
    .limit(12);

  // Dedupe (inner join can return multiples) and sort by event count
  const uniqueOrganizers = organizers
    ? Object.values(
        organizers.reduce<
          Record<
            string,
            { id: string; org_name: string; logo_url: string | null; event_count: number }
          >
        >((acc, org: any) => {
          if (!acc[org.id]) {
            acc[org.id] = {
              id: org.id,
              org_name: org.org_name,
              logo_url: org.logo_url,
              event_count: 0,
            };
          }
          acc[org.id].event_count += Array.isArray(org.events) ? org.events.length : 1;
          return acc;
        }, {}),
      ).sort((a, b) => b.event_count - a.event_count)
    : [];

  if (uniqueOrganizers.length === 0) return null;

  return (
    <section className="py-10 bg-white dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-8">
          Trusted by Organizers
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          {uniqueOrganizers.map((org) => (
            <Link
              key={org.id}
              href={`/organizers/${org.id}`}
              className="flex flex-col items-center gap-2 group"
            >
              <Avatar
                src={org.logo_url}
                alt={org.org_name}
                size="lg"
                className="ring-2 ring-transparent group-hover:ring-lime-500 transition-all group-hover:scale-110"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors font-medium max-w-[80px] text-center truncate">
                {org.org_name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
