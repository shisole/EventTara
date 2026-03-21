-- Add tags column to event_reviews for review tag pills
ALTER TABLE event_reviews ADD COLUMN tags text[] DEFAULT '{}';
