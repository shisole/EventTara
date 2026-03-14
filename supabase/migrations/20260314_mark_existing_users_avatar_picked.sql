-- Mark all existing users with a username as having picked an avatar
-- so they don't get redirected to /setup-avatar on next login
UPDATE users SET has_picked_avatar = true WHERE username IS NOT NULL;
