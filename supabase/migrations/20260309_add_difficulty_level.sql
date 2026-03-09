-- Add difficulty_level column to events (used for hiking, trail run, MTB)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS difficulty_level INTEGER;
