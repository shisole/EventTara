import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPayloadClient } from "@/lib/payload/client";
import { RichText } from "@payloadcms/richtext-lexical/react";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "pages",
      where: { slug: { equals: slug }, status: { equals: "published" } },
      limit: 1,
    });

    const page = result.docs[0];
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

  let page;
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "pages",
      where: { slug: { equals: slug }, status: { equals: "published" } },
      limit: 1,
    });
    page = result.docs[0];
  } catch {
    notFound();
  }

  if (!page) notFound();

  const lastUpdated = page.lastUpdatedLabel
    ? new Date(page.lastUpdatedLabel).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {page.title}
      </h1>
      {lastUpdated && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: {lastUpdated}</p>
      )}
      {page.content && (
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <RichText data={page.content} />
        </div>
      )}
    </main>
  );
}
