import Link from "next/link";
import { notFound, redirect } from "next/navigation";

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

  // Find welcome pages for this club
  const { data: welcomePages } = await supabase
    .from("welcome_pages")
    .select("id, code, title")
    .eq("club_id", club.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold dark:text-white">Welcome QR Codes</h1>

      {welcomePages && welcomePages.length > 0 ? (
        <div className="space-y-8">
          {welcomePages.map((page) => (
            <WelcomeQRCode key={page.id} code={page.code} clubName={club.name} title={page.title} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30">
          <h3 className="text-lg font-heading font-bold mb-2 dark:text-white">
            No welcome pages yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Create a welcome page for this club to generate a scannable QR code.
          </p>
          <Link
            href={`/dashboard/clubs/${slug}`}
            className="text-sm text-lime-600 dark:text-lime-400 hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
