# Profile Clubs Section

## Problem

The profile page (`/profile/[username]`) has no clubs section. Users who are club members or owners have no way to showcase their clubs on their profile.

## Design

### Visibility

- Shown on both own profile and other users' profiles
- Positioned after Profile Stats, before Strava sections

### Component: `ProfileClubs`

- Section header: "Clubs" with count (e.g., "Clubs · 3")
- Responsive grid: 1 col mobile, 2 col tablet, 3 col desktop
- Reuses existing `ClubCard` component with `ClubRoleBadge` overlay
- Max 6 clubs displayed; "View all N clubs" link if more
- Empty state: "Not a member of any clubs yet" + "Browse Clubs" link (own profile) or "No clubs yet" (other profiles)

### Data Flow

Server-side in `profile/[username]/page.tsx`:

1. Query `club_members` for the profile user's memberships + roles
2. Query `clubs` for club details
3. Count members per club via `club_members`
4. Pass combined data to `<ProfileClubs />`

No new API route needed.

### Files

- **New:** `src/components/profile/ProfileClubs.tsx`
- **Modified:** `src/app/(frontend)/(participant)/profile/[username]/page.tsx`
