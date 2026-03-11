import { notFound, redirect } from "next/navigation";

import WelcomePageEditor from "@/components/dashboard/WelcomePageEditor";
import WelcomeQRCode from "@/components/dashboard/WelcomeQRCode";
import { createClient } from "@/lib/supabase/server";

export default async function WelcomeQRPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();
  if (!club) notFound();

  // Check permission
  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    redirect(`/dashboard/clubs/${slug}`);
  }

  // Fetch welcome page for this club
  const { data: welcomePage } = await supabase
    .from("welcome_pages")
    .select("*")
    .eq("club_id", club.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Get claim count if welcome page exists
  let claimCount = 0;
  if (welcomePage) {
    const { count } = await supabase
      .from("welcome_page_claims")
      .select("id", { count: "exact", head: true })
      .eq("welcome_page_id", welcomePage.id);
    claimCount = count ?? 0;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold dark:text-white">Welcome QR Code</h1>

      {welcomePage ? (
        <div className="space-y-8">
          <WelcomeQRCode code={welcomePage.code} clubName={club.name} title={welcomePage.title} />
          <WelcomePageEditor
            welcomePage={welcomePage}
            claimCount={claimCount}
            clubSlug={club.slug}
          />
        </div>
      ) : (
        <GenerateWelcomePage clubSlug={club.slug} clubName={club.name} />
      )}
    </div>
  );
}

function GenerateWelcomePage({ clubSlug, clubName }: { clubSlug: string; clubName: string }) {
  return (
    <div className="rounded-2xl bg-white py-12 text-center shadow-md dark:bg-gray-900 dark:shadow-gray-950/30">
      <h3 className="mb-2 text-lg font-heading font-bold dark:text-white">No welcome page yet</h3>
      <p className="mb-4 text-gray-500 dark:text-gray-400">
        Generate a welcome page for {clubName} to create a scannable QR code.
      </p>
      <GenerateButton clubSlug={clubSlug} />
    </div>
  );
}

function GenerateButton({ clubSlug }: { clubSlug: string }) {
  async function generate() {
    "use server";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: club } = await supabase
      .from("clubs")
      .select("id, name, slug")
      .eq("slug", clubSlug)
      .single();
    if (!club) return;

    await supabase.from("welcome_pages").insert({
      code: club.slug,
      title: `Welcome to ${club.name}!`,
      subtitle: "Scan to join the crew",
      club_id: club.id,
      redirect_url: `/clubs/${club.slug}`,
      is_active: true,
      created_by: user.id,
    });

    redirect(`/dashboard/clubs/${clubSlug}/welcome-qr`);
  }

  return (
    <form action={generate}>
      <button
        type="submit"
        className="rounded-lg bg-lime-500 px-6 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-lime-400"
      >
        Generate Welcome Page
      </button>
    </form>
  );
}
