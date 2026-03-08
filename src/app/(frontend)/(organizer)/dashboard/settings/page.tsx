import OrganizerProfileForm from "@/components/dashboard/OrganizerProfileForm";
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

  const { data: profile } = await supabase
    .from("organizer_profiles")
    .select("*")
    .eq("user_id", user!.id)
    .single();

  // Look up the club associated with this organizer via club_members
  const { data: ownerMembership } = await supabase
    .from("club_members")
    .select("club_id, clubs(slug, name)")
    .eq("user_id", user!.id)
    .eq("role", "owner")
    .single();

  const club = ownerMembership?.clubs
    ? Array.isArray(ownerMembership.clubs)
      ? ownerMembership.clubs[0]
      : ownerMembership.clubs
    : null;

  return (
    <div className="space-y-10 max-w-2xl mx-auto">
      <h1 className="text-2xl font-heading font-bold mb-6 dark:text-white">Settings</h1>

      <div className="space-y-10">
        <section>
          <h2 className="text-xl font-heading font-bold mb-4 dark:text-white">Organizer Profile</h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6">
            <OrganizerProfileForm
              profile={
                profile
                  ? {
                      id: profile.id,
                      org_name: profile.org_name,
                      description: profile.description,
                      logo_url: profile.logo_url,
                    }
                  : null
              }
            />
          </div>
        </section>

        {profile && (
          <section>
            <h2 className="text-xl font-heading font-bold mb-4 dark:text-white">
              Payment Settings
            </h2>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6">
              <PaymentSettingsForm
                profileId={profile.id}
                paymentInfo={(profile.payment_info as any) || {}}
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
