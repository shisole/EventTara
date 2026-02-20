import { createClient } from "@/lib/supabase/server";
import OrganizerProfileForm from "@/components/dashboard/OrganizerProfileForm";
import PaymentSettingsForm from "@/components/dashboard/PaymentSettingsForm";

export const metadata = { title: "Settings — EventTara" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("organizer_profiles")
    .select("*")
    .eq("user_id", user!.id)
    .single();

  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h1 className="text-2xl font-heading font-bold mb-6">Settings</h1>
      </div>

      <section>
        <h2 className="text-xl font-heading font-bold mb-4">Organizer Profile</h2>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6">
          <OrganizerProfileForm
            profile={profile ? {
              id: profile.id,
              org_name: profile.org_name,
              description: profile.description,
              logo_url: profile.logo_url,
            } : null}
          />
        </div>
      </section>

      {profile && (
        <section>
          <h2 className="text-xl font-heading font-bold mb-4">Payment Settings</h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6">
            <PaymentSettingsForm
              profileId={profile.id}
              paymentInfo={(profile.payment_info as any) || {}}
            />
          </div>
        </section>
      )}
    </div>
  );
}
