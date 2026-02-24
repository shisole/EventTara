import { notFound } from "next/navigation";

import GuideForm from "@/components/dashboard/GuideForm";
import { createClient } from "@/lib/supabase/server";

import DeleteGuideButton from "./DeleteGuideButton";

export const metadata = { title: "Edit Guide — EventTara" };

export default async function EditGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: guide } = await supabase.from("guides").select("*").eq("id", id).single();

  if (!guide) notFound();

  // Verify ownership
  if (guide.created_by !== user?.id) notFound();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-heading font-bold dark:text-white">Edit Guide</h1>
        <DeleteGuideButton guideId={id} />
      </div>
      <GuideForm
        mode="edit"
        initialData={{
          id: guide.id,
          full_name: guide.full_name,
          bio: guide.bio,
          avatar_url: guide.avatar_url,
          contact_number: guide.contact_number,
        }}
      />
    </div>
  );
}
