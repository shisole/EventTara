# Google OAuth Login - Design

**Date:** 2026-03-07
**Status:** Approved

## Overview

Add "Continue with Google" login to EventTara using Supabase's built-in Google OAuth provider. This is the simplest integration path — Supabase handles token exchange and session creation, while we extend the auth callback to sync Google profile data into the `users` table.

## GCP Setup (Manual)

1. Create OAuth 2.0 credentials in Google Cloud Console
2. Set authorized redirect URI to: `https://<supabase-project>.supabase.co/auth/v1/callback`
3. Add Client ID + Secret to Supabase Dashboard → Authentication → Providers → Google

## Components

### Google Icon

- New `GoogleIcon` in `src/components/icons/` using the official Google "G" logo SVG
- Added to barrel export in `index.ts`

### Login & Signup Pages

- Add "Continue with Google" button above the existing Strava button on both pages
- Uses `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' } })`
- Same visual pattern as Strava button (full-width, icon + text)

### Auth Callback Enhancement

- Extend `/auth/callback/route.ts` to detect Google sign-ins via `user.app_metadata.provider === 'google'`
- For new Google users: populate `users` table with `full_name`, `avatar_url`, and generate a username
- For existing Google users: optionally sync avatar if changed

## No New Database Tables

- Supabase handles Google tokens internally
- User data goes into the existing `users` table

## Decisions

- **Supabase built-in OAuth** chosen over manual flow (simpler, less code)
- **Extended callback** chosen to ensure Google profile data syncs to `users` table
- **Both pages** — button appears on login and signup
