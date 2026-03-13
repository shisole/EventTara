import { NavLink } from "@/components/navigation/NavigationContext";

interface OrganizerAlertStripProps {
  pendingCount: number;
  clubCount: number;
}

export default function OrganizerAlertStrip({ pendingCount, clubCount }: OrganizerAlertStripProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-2.5 text-sm dark:bg-amber-900/20">
      <p className="text-amber-800 dark:text-amber-200">
        You have{" "}
        <span className="font-semibold">
          {pendingCount} pending booking{pendingCount === 1 ? "" : "s"}
        </span>
        {clubCount > 1 && (
          <>
            {" "}
            across <span className="font-semibold">{clubCount} clubs</span>
          </>
        )}
      </p>
      <NavLink
        href="/dashboard"
        className="shrink-0 text-sm font-medium text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
      >
        Go to Dashboard &rarr;
      </NavLink>
    </div>
  );
}
