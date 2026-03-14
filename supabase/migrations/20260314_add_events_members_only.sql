-- Add per-event members_only toggle
-- When true, only club members can book the event (event still appears publicly with badge)
ALTER TABLE events ADD COLUMN IF NOT EXISTS members_only boolean NOT NULL DEFAULT false;
