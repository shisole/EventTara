import { Avatar } from "@/components/ui";

interface OrganizerCardProps {
  orgName: string;
  logoUrl: string | null;
  eventCount: number;
}

export default function OrganizerCard({ orgName, logoUrl, eventCount }: OrganizerCardProps) {
  return (
    <div className="bg-gray-50 rounded-2xl p-5 flex items-center gap-4">
      <Avatar src={logoUrl} alt={orgName} size="lg" />
      <div>
        <h3 className="font-heading font-bold">{orgName}</h3>
        <p className="text-sm text-gray-500">{eventCount} event{eventCount !== 1 ? "s" : ""} organized</p>
      </div>
    </div>
  );
}
