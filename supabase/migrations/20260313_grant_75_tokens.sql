-- Grant 75 TaraTokens to all existing users
INSERT INTO tara_tokens (user_id, balance, updated_at)
SELECT id, 75, now()
FROM users
ON CONFLICT (user_id) DO UPDATE SET balance = tara_tokens.balance + 75, updated_at = now();

INSERT INTO token_transactions (user_id, amount, reason, reference_id)
SELECT id, 75, 'admin_grant', 'bonus-75-tokens'
FROM users;
