-- Allow anon to read qr_claim_batches (needed for the claim page to show badge preview)
CREATE POLICY "qr_claim_batches_select_anon"
  ON qr_claim_batches FOR SELECT
  TO anon
  USING (true);

-- Allow service_role (used for new user QR claims) to call claim_qr_code
-- The function is SECURITY DEFINER so it already bypasses RLS internally.
GRANT EXECUTE ON FUNCTION claim_qr_code(TEXT, UUID) TO anon;
