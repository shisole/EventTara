import BadgeCard from "./BadgeCard";

interface Badge {
  title: string;
  eventName: string;
  imageUrl: string | null;
  awardedAt: string;
}

export default function BadgeGrid({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-3xl mb-2">&#127941;</p>
        <p className="text-gray-500 dark:text-gray-400">No badges yet. Join events to earn badges!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {badges.map((badge, i) => (
        <BadgeCard key={i} {...badge} />
      ))}
    </div>
  );
}
