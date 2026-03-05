export default function OrganizerReviewsLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-9 w-9 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700"
            />
          ))}
        </div>
      </div>

      {/* Section heading */}
      <div className="mx-auto mb-6 h-7 w-48 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />

      {/* Review button placeholder */}
      <div className="mb-6 flex justify-center">
        <div className="h-10 w-36 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700" />
      </div>

      {/* Review cards */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
                <div className="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
              </div>
            </div>
            <div className="mb-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className="h-4 w-4 animate-pulse rounded bg-gray-200 dark:bg-slate-700"
                />
              ))}
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
