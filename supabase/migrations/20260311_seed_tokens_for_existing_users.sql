-- Grant 9999 TaraTokens to all existing users who don't have a balance yet
INSERT INTO tara_tokens (user_id, balance, updated_at)
SELECT id, 9999, now()
FROM users
ON CONFLICT (user_id) DO UPDATE SET balance = 9999, updated_at = now();

-- Record a transaction for each user
INSERT INTO token_transactions (user_id, amount, reason, reference_id)
SELECT id, 9999, 'admin_grant', 'seed-initial-tokens'
FROM users;
