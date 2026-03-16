-- Allow service_role (used for new user QR claims) to call claim_qr_code
-- The function is SECURITY DEFINER so it already bypasses RLS internally.
GRANT EXECUTE ON FUNCTION claim_qr_code(TEXT, UUID) TO anon;
