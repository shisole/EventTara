export type ClubRole = "owner" | "admin" | "moderator" | "member";
export type ClubVisibility = "public" | "private";

export interface Club {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  activity_types: string[];
  visibility: ClubVisibility;
  payment_info: Record<string, unknown> | null;
  location: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: ClubRole;
  joined_at: string;
}

export interface ClubInvite {
  id: string;
  club_id: string;
  invited_by: string;
  invite_code: string;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  created_at: string;
}

export interface ClubWithStats extends Club {
  member_count: number;
  event_count: number;
}

export interface ClubMemberWithUser extends ClubMember {
  user: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}
