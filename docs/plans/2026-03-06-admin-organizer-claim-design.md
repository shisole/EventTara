# Admin-Created Organizer Accounts with Claim Flow

## Goal

Allow admins to create organizer profiles (name, username, avatar) before the organizer has signed up. This lets reviews and content reference the organizer during beta phase 2, while giving organizers a claim link to take ownership of their account when ready.

## Architecture

**Approach A: Claim Token in organizer_profiles.** No new tables — add `claim_token`, `claim_expires_at`, and `is_claimed` columns to `organizer_profiles`. Admin creates profiles with `user_id = null`. On claim, an auth user is created and linked.

## Database Changes

Add to `organizer_profiles`:

- `claim_token` (UUID, nullable, unique) — random token for claim URL
- `claim_expires_at` (timestamptz, nullable) — 30 days from creation
- `is_claimed` (boolean, default false) — tracks claim status

`user_id` becomes nullable (currently required). When unclaimed, `user_id` is null. On claim, it gets set.

`logo_url` already exists — admin uploads avatar there.

## Admin Panel (`/admin/organizers`)

- **Form:** org name, username, avatar upload
- **Table:** org name, username, status (pending/claimed), copy claim link button
- Claim link format: `{site_url}/claim/{claim_token}`
- Admin can regenerate expired links (new token + reset 30-day expiry)

## Claim Page (`/claim/[token]`)

Looks up `organizer_profiles` by `claim_token` where `is_claimed = false` and not expired.

**Shows:** org name (editable), username (read-only)

**Asks for:** email, password, full name

**On submit:**

1. Create auth user via Supabase `signUp`
2. Create `users` row with `role = 'organizer'`
3. Update `organizer_profiles`: set `user_id`, `is_claimed = true`, null out `claim_token`, update `org_name` if changed
4. Auto-login and redirect to `/dashboard`

## API Routes

- `POST /api/admin/organizers` — create organizer profile with claim token (admin only)
- `GET /api/admin/organizers` — list all organizer profiles with claim status (admin only)
- `POST /api/claim/[token]` — process claim (create auth user, link profile)

## Edge Cases

- **Expired link:** "This link has expired. Contact the admin for a new one."
- **Already claimed:** "This organizer account has already been claimed."
- **Invalid token:** 404
- **Email already in use:** form validation error
- **Regenerate link:** admin clicks regenerate → new UUID token, expiry reset to 30 days from now

## Status Tracking in Admin

| State               | `user_id` | `claim_token` | `is_claimed`                     |
| ------------------- | --------- | ------------- | -------------------------------- |
| Pending (unclaimed) | null      | UUID          | false                            |
| Claimed             | user UUID | null          | true                             |
| Expired             | null      | UUID          | false (check `claim_expires_at`) |
