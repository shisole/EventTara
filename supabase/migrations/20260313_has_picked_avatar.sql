ALTER TABLE public.users ADD COLUMN IF NOT EXISTS has_picked_avatar boolean DEFAULT false;
