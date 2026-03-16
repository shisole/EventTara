-- Add event_id column to welcome_pages for event-specific welcome pages
ALTER TABLE welcome_pages ADD COLUMN event_id UUID REFERENCES events(id);

CREATE INDEX idx_welcome_pages_event_id ON welcome_pages(event_id);
