import SectionOrderManager from "@/components/admin/SectionOrderManager";

export default function SectionsPage() {
  return (
    <div>
      <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">
        Homepage Sections
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Reorder and toggle homepage sections. Disabled sections are hidden from visitors.
      </p>
      <SectionOrderManager />
    </div>
  );
}
