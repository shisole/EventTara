import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { sanitizeRichText } from "@/lib/utils/sanitize-html";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const supabase = await createClient();
    const { data: page } = await supabase
      .from("cms_pages")
      .select("title, description")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (!page) return {};

    return {
      title: page.title,
      description: page.description || undefined,
    };
  } catch {
    return {};
  }
}

export default async function CMSPage({ params }: Props) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: page } = await supabase
    .from("cms_pages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!page) notFound();

  const lastUpdated = page.last_updated_label
    ? new Date(page.last_updated_label).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <header className="mb-10">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          {page.title}
        </h1>
        {lastUpdated && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: {lastUpdated}</p>
        )}
        <div className="mt-6 h-px bg-gradient-to-r from-lime-500/40 via-teal-500/40 to-transparent" />
      </header>
      {page.content_html && (
        <div
          className="prose prose-gray dark:prose-invert max-w-none prose-headings:font-heading prose-h3:text-lg prose-h3:font-semibold prose-a:text-teal-600 dark:prose-a:text-teal-400 prose-a:underline-offset-2 prose-li:marker:text-lime-500 prose-strong:text-gray-900 dark:prose-strong:text-white"
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(page.content_html) }}
        />
      )}
    </main>
  );
}
