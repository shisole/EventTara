import Image from "next/image";
import Link from "next/link";

interface OrganizerCardProps {
  /** Club slug for linking to /clubs/[slug] */
  clubSlug?: string;
  /** Falls back to organizer link if no club slug */
  organizerId?: string;
  orgName: string;
  logoUrl: string | null;
  eventCount: number;
}

export default function OrganizerCard({
  clubSlug,
  organizerId,
  orgName,
  logoUrl,
  eventCount,
}: OrganizerCardProps) {
  const href = clubSlug ? `/clubs/${clubSlug}` : `/organizers/${organizerId}`;
  const initial = orgName.charAt(0).toUpperCase();

  return (
    <Link href={href}>
      <div className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-2xl p-5 flex items-center gap-4">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={orgName}
            width={48}
            height={48}
            className="rounded-full object-cover w-12 h-12 flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
            {initial}
          </div>
        )}
        <div>
          <h3 className="font-heading font-bold">{orgName}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {eventCount} event{eventCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </Link>
  );
}
