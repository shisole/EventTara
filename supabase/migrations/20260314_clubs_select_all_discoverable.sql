-- Make all clubs discoverable (SELECT) regardless of visibility.
-- Private clubs are still restricted for joining (handled by app logic),
-- but they should appear in search/browse listings.
DROP POLICY IF EXISTS "clubs_select_public" ON public.clubs;
CREATE POLICY "clubs_select_all" ON public.clubs
  FOR SELECT USING (true);
