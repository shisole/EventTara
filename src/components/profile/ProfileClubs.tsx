import Link from "next/link";

import ClubCard from "@/components/clubs/ClubCard";
import ClubRoleBadge from "@/components/clubs/ClubRoleBadge";

export interface ProfileClub {
  slug: string;
  name: string;
  logo_url: string | null;
  activity_types: string[];
  member_count: number;
  visibility: "public" | "private";
  description: string | null;
  role: "owner" | "admin" | "moderator" | "member";
}

interface ProfileClubsProps {
  clubs: ProfileClub[];
  isOwnProfile: boolean;
}

const MAX_DISPLAY = 6;

export default function ProfileClubs({ clubs, isOwnProfile }: ProfileClubsProps) {
  if (clubs.length === 0) {
    return (
      <section>
        <h2 className="text-xl font-heading font-bold mb-4">Clubs</h2>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isOwnProfile ? "Not a member of any clubs yet" : "No clubs yet"}
          </p>
          {isOwnProfile && (
            <Link
              href="/clubs"
              className="inline-block mt-3 text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
            >
              Browse Clubs
            </Link>
          )}
        </div>
      </section>
    );
  }

  const displayed = clubs.slice(0, MAX_DISPLAY);

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-heading font-bold">Clubs</h2>
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          {clubs.length}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayed.map((club) => (
          <div key={club.slug} className="relative">
            <ClubCard
              slug={club.slug}
              name={club.name}
              logo_url={club.logo_url}
              activity_types={club.activity_types}
              member_count={club.member_count}
              visibility={club.visibility}
              description={club.description}
            />
            {club.role !== "member" && (
              <div className="absolute top-2 right-2 z-10">
                <ClubRoleBadge role={club.role} />
              </div>
            )}
          </div>
        ))}
      </div>

      {clubs.length > MAX_DISPLAY && (
        <div className="mt-4 text-center">
          <Link
            href="/clubs"
            className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
          >
            View all {clubs.length} clubs
          </Link>
        </div>
      )}
    </section>
  );
}
