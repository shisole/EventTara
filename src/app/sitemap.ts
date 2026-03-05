import { type MetadataRoute } from "next";

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
      priority: 1,
    },
    {
      url: `${siteUrl}/events`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // Fetch all dynamic data in parallel
  const [
    { data: events },
    { data: completedEvents },
    { data: users },
    { data: guides },
    { data: organizers },
  ] = await Promise.all([
    // Published events
    supabase
      .from("events")
      .select("id, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    // Completed events (still indexable)
    supabase
      .from("events")
      .select("id, created_at")
      .eq("status", "completed")
      .order("created_at", { ascending: false }),
    // User profiles
    supabase.from("users").select("username, created_at").not("username", "is", null),
    // Guides
    supabase.from("guides").select("id, created_at").order("created_at", { ascending: false }),
    // Organizer profiles
    supabase
      .from("organizer_profiles")
      .select("id, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const eventPages: MetadataRoute.Sitemap = [...(events || []), ...(completedEvents || [])].map(
    (event) => ({
      url: `${siteUrl}/events/${event.id}`,
      lastModified: new Date(event.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }),
  );

  const profilePages: MetadataRoute.Sitemap = (users || []).map((user) => ({
    url: `${siteUrl}/profile/${user.username}`,
    lastModified: new Date(user.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const guidePages: MetadataRoute.Sitemap = (guides || []).map((guide) => ({
    url: `${siteUrl}/guides/${guide.id}`,
    lastModified: new Date(guide.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const organizerPages: MetadataRoute.Sitemap = (organizers || []).map((org) => ({
    url: `${siteUrl}/organizers/${org.id}`,
    lastModified: new Date(org.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...eventPages, ...profilePages, ...guidePages, ...organizerPages];
}
