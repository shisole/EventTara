-- Participant page enhancements: waiver, notes
ALTER TABLE events ADD COLUMN waiver_text text;
ALTER TABLE bookings ADD COLUMN participant_notes text;
ALTER TABLE bookings ADD COLUMN organizer_notes text;
ALTER TABLE bookings ADD COLUMN waiver_accepted_at timestamptz;
