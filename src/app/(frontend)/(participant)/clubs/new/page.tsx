import type { Metadata } from "next";
import { redirect } from "next/navigation";

import CreateClubForm from "@/components/clubs/CreateClubForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Create a Club -- EventTara",
  description: "Start your own outdoor adventure club on EventTara.",
};

export default async function CreateClubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/clubs/new");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Create a Club</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Set up your community and start organizing events together
        </p>
      </div>

      <CreateClubForm />
    </div>
  );
}
