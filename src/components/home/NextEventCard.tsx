import { differenceInCalendarDays } from "date-fns";
import Image from "next/image";

import { NavLink } from "@/components/navigation/NavigationContext";
import { getActivityLabel, getActivitySolidColor } from "@/lib/constants/activity-types";
import { cn } from "@/lib/utils";
import { formatEventDate } from "@/lib/utils/format-date";

interface NextEventCardProps {
  event: {
    id: string;
    title: string;
    date: string;
    location: string;
    cover_image_url: string | null;
    type: string;
    booking: {
      id: string;
      status: string;
      payment_status: string;
    };
  };
}

function formatCountdown(date: string): string {
  const days = differenceInCalendarDays(new Date(date), new Date());
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${String(days)} days`;
}

export default function NextEventCard({ event }: NextEventCardProps) {
  const countdown = formatCountdown(event.date);
  const formattedDate = formatEventDate(event.date, null, { short: true });
  const paymentPending = event.booking.payment_status === "pending";

  return (
    <NavLink href={`/events/${event.id}`}>
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
        {/* Cover image */}
        <div className="relative h-32 bg-gradient-to-br from-lime-100 to-forest-100 dark:from-lime-900 dark:to-forest-900">
          {event.cover_image_url && (
            <Image
              src={event.cover_image_url}
              alt={event.title}
              fill
              sizes="(max-width: 672px) 100vw, 672px"
              className="object-cover"
            />
          )}

          {/* Countdown badge — top left */}
          <div className="absolute top-3 left-3">
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm",
                countdown === "Today"
                  ? "bg-green-500 text-white"
                  : countdown === "Tomorrow"
                    ? "bg-amber-500 text-white"
                    : "bg-white/90 text-gray-800 dark:bg-gray-900/80 dark:text-gray-100",
              )}
            >
              {countdown}
            </span>
          </div>

          {/* Activity type — bottom left */}
          <div className="absolute bottom-3 left-3">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm",
                getActivitySolidColor(event.type),
              )}
            >
              {getActivityLabel(event.type)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading font-bold text-base truncate">{event.title}</h3>
            {paymentPending && (
              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                Payment Pending
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5 min-w-0">
              <svg
                className="h-3.5 w-3.5 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="truncate">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <svg
                className="h-3.5 w-3.5 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="truncate">{event.location}</span>
            </div>
          </div>
        </div>
      </div>
    </NavLink>
  );
}
