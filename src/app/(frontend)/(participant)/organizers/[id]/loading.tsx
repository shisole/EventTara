export default function OrganizerProfileLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10 animate-pulse">
      {/* Header skeleton */}
      <div className="text-center space-y-4">
        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto" />
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
          <div className="h-3 w-36 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
        </div>
        <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({length: 3}).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 text-center space-y-2"
          >
            <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
          </div>
        ))}
      </div>

      {/* Events skeleton */}
      <div>
        <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {Array.from({length: 4}).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm"
            >
              <div className="h-48 bg-gray-200 dark:bg-gray-700" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-5 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
