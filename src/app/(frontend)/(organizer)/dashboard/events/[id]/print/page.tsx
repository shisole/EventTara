import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { formatEventDate } from "@/lib/utils/format-date";

import PrintActions from "./PrintActions";

export default async function PrintParticipantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase.from("events").select("*").eq("id", id).single();
  if (!event) notFound();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, users:user_id(full_name, email)")
    .eq("event_id", id)
    .order("booked_at", { ascending: false });

  const { data: checkins } = await supabase
    .from("event_checkins")
    .select("user_id")
    .eq("event_id", id);

  const checkedInUserIds = new Set((checkins ?? []).map((c) => c.user_id));

  const allBookings = bookings ?? [];
  const activeBookings = allBookings.filter((b) => !(b as any).participant_cancelled);
  const totalCount = allBookings.length;
  const activeCount = activeBookings.length;

  const formattedDate = formatEventDate(event.date, event.end_date);

  return (
    <div className="mx-auto max-w-4xl px-8 py-10 font-sans text-gray-900">
      {/* Print styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .no-print { display: none !important; }
              body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #d1d5db !important; padding: 6px 10px; }
              tr { break-inside: avoid; }
              @page { margin: 1.5cm; }
            }
          `,
        }}
      />

      {/* Action buttons — hidden in print */}
      <PrintActions eventId={id} />

      {/* Header */}
      <div className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
          <span>{formattedDate}</span>
          {event.location && <span>{event.location}</span>}
        </div>
        <p className="mt-3 text-sm text-gray-500">
          {activeCount} active participant{activeCount === 1 ? "" : "s"}
          {totalCount === activeCount ? "" : ` (${totalCount - activeCount} cancelled)`}
        </p>
      </div>

      {/* Participants table */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-300 text-left">
            <th className="border border-gray-200 bg-gray-50 px-3 py-2 font-semibold">#</th>
            <th className="border border-gray-200 bg-gray-50 px-3 py-2 font-semibold">Name</th>
            <th className="border border-gray-200 bg-gray-50 px-3 py-2 font-semibold">
              Email / Contact
            </th>
            <th className="border border-gray-200 bg-gray-50 px-3 py-2 font-semibold">Status</th>
            <th className="border border-gray-200 bg-gray-50 px-3 py-2 font-semibold text-center">
              Check-in
            </th>
            <th className="border border-gray-200 bg-gray-50 px-3 py-2 font-semibold text-center">
              Waiver
            </th>
            <th className="border border-gray-200 bg-gray-50 px-3 py-2 font-semibold">Notes</th>
          </tr>
        </thead>
        <tbody>
          {activeBookings.map((booking, index) => {
            const b = booking as any;
            const name: string = b.users?.full_name || b.manual_name || "Guest";
            const email: string = b.users?.email || b.manual_contact || "";
            const status: string = b.added_by ? b.manual_status || "manual" : b.payment_status;
            const isCheckedIn = b.user_id ? checkedInUserIds.has(b.user_id) : false;
            const waiverSigned = !!b.waiver_accepted_at;
            const notes: string = b.participant_notes || b.organizer_notes || "";

            return (
              <tr key={b.id} className="break-inside-avoid border-b border-gray-200">
                <td className="border border-gray-200 px-3 py-2 text-gray-500">{index + 1}</td>
                <td className="border border-gray-200 px-3 py-2 font-medium">{name}</td>
                <td className="border border-gray-200 px-3 py-2 text-gray-600">{email}</td>
                <td className="border border-gray-200 px-3 py-2">
                  <span className="capitalize">{status}</span>
                </td>
                <td className="border border-gray-200 px-3 py-2 text-center">
                  {isCheckedIn ? (
                    <span className="text-green-700">&#10003;</span>
                  ) : (
                    <span className="inline-block h-4 w-4 border border-gray-400" />
                  )}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-center">
                  {waiverSigned ? (
                    <span className="text-green-700">&#10003;</span>
                  ) : (
                    <span className="text-gray-400">&mdash;</span>
                  )}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-gray-600 text-xs">{notes}</td>
              </tr>
            );
          })}
          {activeBookings.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="border border-gray-200 px-3 py-8 text-center text-gray-400"
              >
                No participants yet
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-400">
        Generated on {new Date().toLocaleDateString("en-PH")} &mdash; EventTara
      </div>
    </div>
  );
}
