-- Club rental gear add-ons
-- Clubs can manage rental inventory; participants select add-ons during booking

-- Club inventory table
CREATE TABLE IF NOT EXISTS club_rental_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('tent', 'sleeping_bag', 'trekking_poles', 'bike', 'helmet', 'backpack', 'other')),
  description text,
  rental_price numeric NOT NULL DEFAULT 0,
  quantity_total int NOT NULL DEFAULT 1,
  image_url text,
  sizes jsonb, -- e.g. ["S","M","L"] or null
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Booking rental selections
CREATE TABLE IF NOT EXISTS booking_rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  rental_item_id uuid NOT NULL REFERENCES club_rental_items(id),
  quantity int NOT NULL DEFAULT 1,
  size text, -- selected size if applicable
  unit_price numeric NOT NULL, -- snapshot at booking time
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_club_rental_items_club_id ON club_rental_items(club_id);
CREATE INDEX idx_club_rental_items_active ON club_rental_items(club_id, is_active);
CREATE INDEX idx_booking_rentals_booking_id ON booking_rentals(booking_id);
CREATE INDEX idx_booking_rentals_rental_item_id ON booking_rentals(rental_item_id);

-- RLS
ALTER TABLE club_rental_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_rentals ENABLE ROW LEVEL SECURITY;

-- club_rental_items: public read for active items
CREATE POLICY "Anyone can view active rental items"
  ON club_rental_items FOR SELECT
  USING (is_active = true);

-- club_rental_items: club owner/admin can manage
CREATE POLICY "Club staff can manage rental items"
  ON club_rental_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = club_rental_items.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = club_rental_items.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('owner', 'admin')
    )
  );

-- booking_rentals: booking owner can view
CREATE POLICY "Booking owner can view rental selections"
  ON booking_rentals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_rentals.booking_id
        AND bookings.user_id = auth.uid()
    )
  );

-- booking_rentals: club staff can view
CREATE POLICY "Club staff can view booking rentals"
  ON booking_rentals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      JOIN events ON events.id = bookings.event_id
      JOIN club_members ON club_members.club_id = events.club_id
      WHERE bookings.id = booking_rentals.booking_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('owner', 'admin', 'moderator')
    )
  );

-- booking_rentals: authenticated users can insert
CREATE POLICY "Authenticated users can insert booking rentals"
  ON booking_rentals FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
