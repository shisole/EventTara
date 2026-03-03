import Link from "next/link";

import EventForm from "@/components/dashboard/EventForm";
import { ChevronLeftIcon } from "@/components/icons";

export const metadata = { title: "Create Event — EventTara" };

export default function NewEventPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard/events"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors mb-6"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to Events
      </Link>
      <h1 className="text-2xl font-heading font-bold mb-8 dark:text-white">Create New Event</h1>
      <EventForm mode="create" />
    </div>
  );
}
