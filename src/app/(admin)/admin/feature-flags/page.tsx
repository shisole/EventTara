import FeatureFlagsForm from "@/components/admin/FeatureFlagsForm";

export default function FeatureFlagsPage() {
  return (
    <div>
      <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">
        Feature Flags
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Toggle features on and off. Changes take effect after cache revalidation (~30s).
      </p>
      <FeatureFlagsForm />
    </div>
  );
}
