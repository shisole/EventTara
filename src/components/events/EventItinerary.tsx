interface ItineraryEntry {
  id: string;
  time: string;
  title: string;
  sort_order: number;
}

interface EventItineraryProps {
  entries: ItineraryEntry[];
}

export default function EventItinerary({ entries }: EventItineraryProps) {
  if (entries.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-heading font-bold mb-4 dark:text-white">Itinerary</h2>
      <div className="relative pl-5">
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />
        <ol className="space-y-4">
          {entries.map((entry) => (
            <li key={entry.id} className="relative">
              <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-teal-500 border-2 border-white dark:border-gray-900 shadow-sm" />
              <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 leading-none mb-0.5">
                {entry.time}
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-200">{entry.title}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
