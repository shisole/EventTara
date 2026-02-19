import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://eventtara.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/events`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // Published events
  const { data: events } = await supabase
    .from("events")
    .select("id, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const eventPages: MetadataRoute.Sitemap = (events || []).map((event) => ({
    url: `${siteUrl}/events/${event.id}`,
    lastModified: new Date(event.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // User profiles
  const { data: users } = await supabase
    .from("users")
    .select("username, created_at")
    .not("username", "is", null);

  const profilePages: MetadataRoute.Sitemap = (users || []).map((user) => ({
    url: `${siteUrl}/profile/${user.username}`,
    lastModified: new Date(user.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...eventPages, ...profilePages];
}
