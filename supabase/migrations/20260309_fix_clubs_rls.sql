-- ============================================================================
-- Fix clubs + club_members RLS policies
-- ============================================================================

-- 1. Fix clubs INSERT policy: use auth.uid() instead of auth.role()
DROP POLICY IF EXISTS "clubs_insert_authenticated" ON public.clubs;
CREATE POLICY "clubs_insert_authenticated" ON public.clubs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Fix club_members: allow creator to set themselves as owner on a new club
--    The existing policies only allow role='member' self-insert or require
--    an existing owner/admin, creating a chicken-and-egg problem.
CREATE POLICY "club_members_insert_creator_as_owner" ON public.club_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND role = 'owner'
    AND NOT EXISTS (
      SELECT 1 FROM public.club_members AS cm
      WHERE cm.club_id = club_members.club_id
    )
  );
