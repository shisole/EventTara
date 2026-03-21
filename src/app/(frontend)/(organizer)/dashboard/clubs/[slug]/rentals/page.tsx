import { redirect } from "next/navigation";

import RentalInventoryManager from "@/components/dashboard/RentalInventoryManager";
import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { createClient } from "@/lib/supabase/server";

export default async function ClubRentalsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  if (!club) redirect("/dashboard");

  const role = await checkClubPermissionServer(user.id, club.id, CLUB_PERMISSIONS.edit_settings);
  if (!role) redirect(`/dashboard/clubs/${slug}`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Rental Gear</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage rental items available for event bookings
        </p>
      </div>
      <RentalInventoryManager clubSlug={slug} />
    </div>
  );
}
