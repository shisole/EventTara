CREATE TABLE public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'booking_confirmed', 'event_reminder', 'badge_earned',
    'border_earned', 'feed_like', 'feed_repost'
  )),
  title text NOT NULL,
  body text NOT NULL,
  href text,
  actor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE read = false;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "insert_authenticated" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "delete_own" ON notifications FOR DELETE USING (auth.uid() = user_id);
