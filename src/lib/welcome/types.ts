import type { Database } from "@/lib/supabase/types";

type WelcomePageRow = Database["public"]["Tables"]["welcome_pages"]["Row"];
type BadgeRow = Database["public"]["Tables"]["badges"]["Row"];
type ClubRow = Database["public"]["Tables"]["clubs"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];

export interface WelcomePageData extends WelcomePageRow {
  badge: Pick<
    BadgeRow,
    "id" | "title" | "description" | "image_url" | "category" | "rarity"
  > | null;
  club: Pick<ClubRow, "id" | "name" | "slug" | "logo_url" | "description"> | null;
  event: Pick<
    EventRow,
    "id" | "title" | "date" | "location" | "cover_image_url" | "type" | "price"
  > | null;
  claimCount: number;
}
