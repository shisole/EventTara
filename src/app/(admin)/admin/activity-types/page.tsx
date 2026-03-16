import { ActivityTypeManager } from "@/components/admin/ActivityTypeManager";

export default function ActivityTypesPage() {
  return (
    <div>
      <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">
        Activity Types
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Manage activity types available on the platform. Changes take effect after cache
        revalidation (~60s).
      </p>
      <ActivityTypeManager />
    </div>
  );
}
