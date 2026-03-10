import type { Database } from "@/lib/supabase/types";

type WelcomePageRow = Database["public"]["Tables"]["welcome_pages"]["Row"];
type BadgeRow = Database["public"]["Tables"]["badges"]["Row"];
type ClubRow = Database["public"]["Tables"]["clubs"]["Row"];

export interface WelcomePageData extends WelcomePageRow {
  badge: Pick<
    BadgeRow,
    "id" | "title" | "description" | "image_url" | "category" | "rarity"
  > | null;
  club: Pick<ClubRow, "id" | "name" | "slug" | "logo_url" | "description"> | null;
  claimCount: number;
}
