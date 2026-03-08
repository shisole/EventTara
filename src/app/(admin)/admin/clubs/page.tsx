import ClubManager from "@/components/admin/ClubManager";

export default function ClubsPage() {
  return (
    <div>
      <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">Clubs</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        View and manage all clubs on the platform.
      </p>
      <ClubManager />
    </div>
  );
}
