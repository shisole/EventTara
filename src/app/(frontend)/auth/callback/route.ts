import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/events";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.user_metadata?.role === "organizer") {
        // Create organizer profile from signup metadata
        const meta = user.user_metadata;

        await supabase.from("organizer_profiles").upsert(
          {
            user_id: user.id,
            org_name: meta.org_name,
            description: meta.org_description || null,
            logo_url: meta.org_logo_url || null,
          },
          { onConflict: "user_id" }
        );

        await supabase
          .from("users")
          .update({ role: "organizer" })
          .eq("id", user.id);

        return NextResponse.redirect(`${origin}/dashboard`);
      }

      // Booking magic link: redirect to confirmation page instead of the booking page
      // The original tab's polling will detect the session and show confetti
      if (next.includes("/book")) {
        return NextResponse.redirect(`${origin}/auth/confirmed`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
