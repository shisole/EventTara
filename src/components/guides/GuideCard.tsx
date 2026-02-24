import Link from "next/link";
import { Avatar } from "@/components/ui";

interface GuideCardProps {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio?: string | null;
  avg_rating?: number | null;
  review_count?: number | null;
  event_count?: number | null;
}

export default function GuideCard({
  id,
  full_name,
  avatar_url,
  bio,
  avg_rating,
  review_count,
  event_count,
}: GuideCardProps) {
  return (
    <Link href={`/guides/${id}`}>
      <div className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-2xl p-5 flex items-center gap-4">
        <Avatar src={avatar_url} alt={full_name} size="lg" />
        <div className="min-w-0">
          <h3 className="font-heading font-bold">{full_name}</h3>
          {avg_rating != null && (
            <p className="text-sm text-golden-500 dark:text-golden-400">
              <span aria-hidden="true">&#9733;</span> {avg_rating.toFixed(1)}
              {review_count != null && (
                <span className="text-gray-500 dark:text-gray-400">
                  {" "}
                  ({review_count} review{review_count !== 1 ? "s" : ""})
                </span>
              )}
            </p>
          )}
          {bio && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{bio}</p>}
          {event_count != null && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {event_count} event{event_count !== 1 ? "s" : ""} guided
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
