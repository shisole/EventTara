/** Frontend types for organizer reviews */

export interface OrganizerReviewPhoto {
  id: string;
  image_url: string;
  sort_order: number;
}

export interface OrganizerReviewUser {
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  active_border_id: string | null;
}

export interface OrganizerReviewWithUser {
  id: string;
  organizer_id: string;
  user_id: string | null; // null when anonymous
  rating: number;
  text: string | null;
  is_anonymous: boolean;
  guest_name: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  user: OrganizerReviewUser | null; // null when anonymous
  photos: OrganizerReviewPhoto[];
}

export interface OrganizerReviewAggregates {
  averageRating: number;
  totalReviews: number;
  tagCounts: Record<string, number>;
}

export interface OrganizerReviewsResponse extends OrganizerReviewAggregates {
  reviews: OrganizerReviewWithUser[];
  page: number;
  hasMore: boolean;
}
