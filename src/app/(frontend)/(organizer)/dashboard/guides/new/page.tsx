import GuideForm from "@/components/dashboard/GuideForm";

export const metadata = { title: "Add Guide — EventTara" };

export default function NewGuidePage() {
  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-8 dark:text-white">Add New Guide</h1>
      <GuideForm mode="create" />
    </div>
  );
}
