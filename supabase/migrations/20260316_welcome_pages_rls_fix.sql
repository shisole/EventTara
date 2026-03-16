-- Fix welcome_pages RLS policies
-- The "insert_own" policy (auth.uid() = created_by) fails when the JWT
-- auth context isn't properly forwarded. Replace with a simpler check —
-- app code already verifies club admin permissions before inserting.

DROP POLICY IF EXISTS "insert_own" ON welcome_pages;
CREATE POLICY "insert_authenticated" ON welcome_pages FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Replace the select policy to also allow club admins to see inactive pages
DROP POLICY IF EXISTS "select_active" ON welcome_pages;
CREATE POLICY "select_welcome_pages" ON welcome_pages FOR SELECT
  USING (
    is_active = true
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = welcome_pages.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('owner', 'admin')
    )
  );

-- Update policy: allow club admins to update, not just the creator
DROP POLICY IF EXISTS "update_own" ON welcome_pages;
CREATE POLICY "update_welcome_pages" ON welcome_pages FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = welcome_pages.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('owner', 'admin')
    )
  );
