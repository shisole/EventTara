-- Fix event_reviews.user_id FK to reference public.users instead of auth.users
-- This allows PostgREST (Supabase client) to join event_reviews with public.users

ALTER TABLE public.event_reviews
  DROP CONSTRAINT event_reviews_user_id_fkey;

ALTER TABLE public.event_reviews
  ADD CONSTRAINT event_reviews_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
