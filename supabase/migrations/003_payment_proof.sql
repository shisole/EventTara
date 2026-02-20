-- Add payment proof fields to bookings
ALTER TABLE public.bookings
  ADD COLUMN payment_proof_url TEXT,
  ADD COLUMN payment_verified_at TIMESTAMPTZ,
  ADD COLUMN payment_verified_by UUID REFERENCES public.users(id);

-- Update payment_method constraint to allow 'cash'
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_method_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_method_check
  CHECK (payment_method IN ('gcash', 'maya', 'cash'));

-- Update payment_status constraint to allow 'rejected'
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'rejected', 'refunded'));

-- Add RLS policy: organizers can update bookings for their events (for verify/reject)
CREATE POLICY "Organizers can update event bookings" ON public.bookings
  FOR UPDATE USING (event_id IN (
    SELECT id FROM public.events WHERE organizer_id IN (
      SELECT id FROM public.organizer_profiles WHERE user_id = auth.uid()
    )
  ));

-- Index for filtering by payment status
CREATE INDEX idx_bookings_payment_status ON public.bookings(payment_status);

-- Create payment-proofs storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload payment proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Anyone can view payment proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment-proofs');

CREATE POLICY "Users can update their own proofs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'payment-proofs');
