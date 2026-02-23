import EventForm from "@/components/dashboard/EventForm";

export const metadata = { title: "Create Event — EventTara" };

export default function NewEventPage() {
  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-8 dark:text-white">Create New Event</h1>
      <EventForm mode="create" />
    </div>
  );
}
