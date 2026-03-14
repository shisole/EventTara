-- Add payment_paused and contact_url to events table
ALTER TABLE events ADD COLUMN payment_paused boolean NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN contact_url text;
