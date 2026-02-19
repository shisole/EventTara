import Link from "next/link";
import { Avatar } from "@/components/ui";

interface OrganizerCardProps {
  organizerId: string;
  orgName: string;
  logoUrl: string | null;
  eventCount: number;
}

export default function OrganizerCard({ organizerId, orgName, logoUrl, eventCount }: OrganizerCardProps) {
  return (
    <Link href={`/organizers/${organizerId}`}>
    <div className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-2xl p-5 flex items-center gap-4">
      <Avatar src={logoUrl} alt={orgName} size="lg" />
      <div>
        <h3 className="font-heading font-bold">{orgName}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{eventCount} event{eventCount !== 1 ? "s" : ""} organized</p>
      </div>
    </div>
    </Link>
  );
}
