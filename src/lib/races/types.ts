export interface RaceParticipant {
  user_id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  isWinner: boolean;
}

export interface RaceData {
  id: string;
  title: string;
  status: "pending" | "completed";
  num_winners: number;
  duration_seconds: number;
  badge_id: string | null;
  club: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  participants: RaceParticipant[];
  completed_at: string | null;
}
