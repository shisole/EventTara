import OrganizerManager from "@/components/admin/OrganizerManager";

export default function OrganizersPage() {
  return (
    <div>
      <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">
        Organizers
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Create organizer profiles and generate claim links for onboarding.
      </p>
      <OrganizerManager />
    </div>
  );
}
