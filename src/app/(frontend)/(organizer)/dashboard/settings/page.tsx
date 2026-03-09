import PaymentSettingsForm from "@/components/dashboard/PaymentSettingsForm";
import ReviewQRCode from "@/components/dashboard/ReviewQRCode";
import StravaConnectionCard from "@/components/strava/StravaConnectionCard";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Settings — EventTara" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Look up the club associated with this user via club_members
  const { data: membership } = await supabase
    .from("club_members")
    .select("club_id, role, clubs(slug, name)")
    .eq("user_id", user!.id)
    .in("role", ["owner", "admin"])
    .limit(1)
    .single();

  const club = membership?.clubs
    ? Array.isArray(membership.clubs)
      ? membership.clubs[0]
      : membership.clubs
    : null;

  // Fetch payment info from the club if the user is an owner/admin
  const clubId = membership?.club_id ?? null;
  const { data: clubData } = clubId
    ? await supabase.from("clubs").select("id, payment_info").eq("id", clubId).single()
    : { data: null };

  return (
    <div className="space-y-10 max-w-2xl mx-auto">
      <h1 className="text-2xl font-heading font-bold mb-6 dark:text-white">Settings</h1>

      <div className="space-y-10">
        {clubData && (
          <section>
            <h2 className="text-xl font-heading font-bold mb-4 dark:text-white">
              Payment Settings
            </h2>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6">
              <PaymentSettingsForm
                profileId={clubData.id}
                paymentInfo={(clubData.payment_info as any) || {}}
              />
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-heading font-bold mb-4 dark:text-white">
            Strava Integration
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6">
            <StravaConnectionCard />
          </div>
        </section>

        {club && (
          <section>
            <h2 className="text-xl font-heading font-bold mb-4 dark:text-white">Review QR Code</h2>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6">
              <ReviewQRCode clubSlug={club.slug} clubName={club.name} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
