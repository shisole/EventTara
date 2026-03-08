-- ============================================================================
-- Migration: Remove events.organizer_id and migrate RLS to club_id + club_members
-- ============================================================================

-- ============================================================================
-- 1. Drop all RLS policies that reference events.organizer_id
-- ============================================================================

-- events table
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Organizers can manage own events" ON public.events;

-- event_photos table
DROP POLICY IF EXISTS "Organizers can manage event photos" ON public.event_photos;

-- bookings table
DROP POLICY IF EXISTS "Organizers can view event bookings" ON public.bookings;
DROP POLICY IF EXISTS "Organizers can update event bookings" ON public.bookings;
DROP POLICY IF EXISTS "Organizers can add participants to their events" ON public.bookings;

-- badges table
DROP POLICY IF EXISTS "Organizers can manage badges" ON public.badges;

-- user_badges table
DROP POLICY IF EXISTS "Organizers can award badges" ON public.user_badges;

-- event_checkins table
DROP POLICY IF EXISTS "Organizers can view event checkins" ON public.event_checkins;
DROP POLICY IF EXISTS "Organizers can check in participants" ON public.event_checkins;

-- booking_companions table
DROP POLICY IF EXISTS "Organizers can view companions" ON public.booking_companions;
DROP POLICY IF EXISTS "Organizers can update companions (check-in)" ON public.booking_companions;

-- event_distances table
DROP POLICY IF EXISTS "event_distances_insert_organizer" ON public.event_distances;
DROP POLICY IF EXISTS "event_distances_update_organizer" ON public.event_distances;
DROP POLICY IF EXISTS "event_distances_delete_organizer" ON public.event_distances;

-- event_mountains table
DROP POLICY IF EXISTS "event_mountains_insert_organizer" ON public.event_mountains;
DROP POLICY IF EXISTS "event_mountains_delete_organizer" ON public.event_mountains;

-- event_guides table
DROP POLICY IF EXISTS "event_guides_insert_organizer" ON public.event_guides;
DROP POLICY IF EXISTS "event_guides_delete_organizer" ON public.event_guides;

-- event_routes table
DROP POLICY IF EXISTS "event_routes_insert_organizer" ON public.event_routes;
DROP POLICY IF EXISTS "event_routes_update_organizer" ON public.event_routes;
DROP POLICY IF EXISTS "event_routes_delete_organizer" ON public.event_routes;

-- ============================================================================
-- 2. Drop organizer_id column from events
-- ============================================================================

ALTER TABLE public.events DROP COLUMN organizer_id;

-- ============================================================================
-- 3. Recreate RLS policies using club_id + club_members
-- ============================================================================

-- Role hierarchy:
--   owner (4) > admin (3) > moderator (2) > member (1)
-- CLUB_PERMISSIONS mapping:
--   create/delete events, manage/award badges → admin+  → ('owner','admin')
--   edit events, manage bookings/checkins/companions/distances → moderator+ → ('owner','admin','moderator')
--   view own club events → member+ → ('owner','admin','moderator','member')

-- ---------- events ----------

CREATE POLICY "Published events are viewable by everyone" ON public.events
  FOR SELECT USING (
    status IN ('published', 'completed')
    OR club_id IN (
      SELECT club_id FROM public.club_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Club staff can manage own events" ON public.events
  FOR ALL USING (
    club_id IN (
      SELECT club_id FROM public.club_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ---------- event_photos ----------

CREATE POLICY "Club staff can manage event photos" ON public.event_photos
  FOR ALL USING (
    event_id IN (
      SELECT id FROM public.events WHERE club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
  );

-- ---------- bookings ----------

CREATE POLICY "Club staff can view event bookings" ON public.bookings
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.events WHERE club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
  );

CREATE POLICY "Club staff can update event bookings" ON public.bookings
  FOR UPDATE USING (
    event_id IN (
      SELECT id FROM public.events WHERE club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
  );

CREATE POLICY "Club staff can add participants to their events" ON public.bookings
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
    AND added_by = auth.uid()
  );

-- ---------- badges ----------

CREATE POLICY "Club staff can manage badges" ON public.badges
  FOR ALL USING (
    event_id IN (
      SELECT id FROM public.events WHERE club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- ---------- user_badges ----------

CREATE POLICY "Club staff can award badges" ON public.user_badges
  FOR INSERT WITH CHECK (
    badge_id IN (
      SELECT b.id FROM public.badges b
      JOIN public.events e ON b.event_id = e.id
      WHERE e.club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- ---------- event_checkins ----------

CREATE POLICY "Club staff can view event checkins" ON public.event_checkins
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.events WHERE club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
  );

CREATE POLICY "Club staff can check in participants" ON public.event_checkins
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
  );

-- ---------- booking_companions ----------

CREATE POLICY "Club staff can view companions" ON public.booking_companions
  FOR SELECT USING (
    booking_id IN (
      SELECT b.id FROM public.bookings b
      JOIN public.events e ON e.id = b.event_id
      WHERE e.club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
  );

CREATE POLICY "Club staff can update companions (check-in)" ON public.booking_companions
  FOR UPDATE USING (
    booking_id IN (
      SELECT b.id FROM public.bookings b
      JOIN public.events e ON e.id = b.event_id
      WHERE e.club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
  );

-- ---------- event_distances ----------

CREATE POLICY "event_distances_insert_club_staff" ON public.event_distances
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_distances.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

CREATE POLICY "event_distances_update_club_staff" ON public.event_distances
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_distances.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

CREATE POLICY "event_distances_delete_club_staff" ON public.event_distances
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_distances.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

-- ---------- event_mountains ----------

CREATE POLICY "event_mountains_insert_club_staff" ON public.event_mountains
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_mountains.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

CREATE POLICY "event_mountains_delete_club_staff" ON public.event_mountains
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_mountains.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

-- ---------- event_guides ----------

CREATE POLICY "event_guides_insert_club_staff" ON public.event_guides
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_guides.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

CREATE POLICY "event_guides_delete_club_staff" ON public.event_guides
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_guides.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

-- ---------- event_routes ----------

CREATE POLICY "event_routes_insert_club_staff" ON public.event_routes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_routes.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

CREATE POLICY "event_routes_update_club_staff" ON public.event_routes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_routes.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

CREATE POLICY "event_routes_delete_club_staff" ON public.event_routes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_routes.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );
