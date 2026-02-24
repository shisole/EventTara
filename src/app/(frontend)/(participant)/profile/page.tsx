import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function ProfileRedirectPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Not logged in or anonymous → login
  if (!authUser || authUser.is_anonymous) {
    redirect("/login");
  }

  // Fetch user record
  const { data: user } = await supabase
    .from("users")
    .select("role, username")
    .eq("id", authUser.id)
    .single();

  if (!user) {
    redirect("/login");
  }

  // Organizer → their organizer profile page
  if (user.role === "organizer") {
    const { data: profile } = await supabase
      .from("organizer_profiles")
      .select("id")
      .eq("user_id", authUser.id)
      .single();

    if (profile) {
      redirect(`/organizers/${profile.id}`);
    }
  }

  // Participant → their profile page (fall back to /events if no username)
  if (user.username) {
    redirect(`/profile/${user.username}`);
  }

  redirect("/events");
}
