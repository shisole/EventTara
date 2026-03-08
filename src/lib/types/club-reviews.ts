/** Frontend types for club reviews */

export interface ClubReviewPhoto {
  id: string;
  image_url: string;
  sort_order: number;
}

export interface ClubReviewUser {
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  active_border_id: string | null;
}

export interface ClubReviewWithUser {
  id: string;
  club_id: string;
  user_id: string | null; // null when anonymous
  rating: number;
  text: string | null;
  is_anonymous: boolean;
  guest_name: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  user: ClubReviewUser | null; // null when anonymous
  photos: ClubReviewPhoto[];
}

export interface ClubReviewAggregates {
  averageRating: number;
  totalReviews: number;
  tagCounts: Record<string, number>;
}

export interface ClubReviewsResponse extends ClubReviewAggregates {
  reviews: ClubReviewWithUser[];
  page: number;
  hasMore: boolean;
}
