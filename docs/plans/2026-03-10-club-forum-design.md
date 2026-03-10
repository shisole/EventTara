# Club Forum Design

## Goal

Add an async forum/discussion feature to clubs where members can create threaded discussions, admins can post announcements, and members can run polls — all organized by admin-defined categories.

## Architecture

Dedicated forum tables (not extending the feed system) to keep concerns separated. Forum lives as a new tab on the existing club page (`/clubs/[slug]`). Thread detail pages at `/clubs/[slug]/forum/[threadId]`.

## Data Model

### `club_forum_categories`

| Column     | Type            | Notes                             |
| ---------- | --------------- | --------------------------------- |
| id         | uuid PK         |                                   |
| club_id    | uuid FK → clubs |                                   |
| name       | text            | e.g., "Trip Reports", "Gear Talk" |
| slug       | text            | URL-safe, unique per club         |
| sort_order | int             | Display order                     |
| created_at | timestamptz     |                                   |

### `club_forum_threads`

| Column           | Type                            | Notes                                          |
| ---------------- | ------------------------------- | ---------------------------------------------- |
| id               | uuid PK                         |                                                |
| club_id          | uuid FK → clubs                 |                                                |
| category_id      | uuid FK → club_forum_categories | nullable (uncategorized)                       |
| user_id          | uuid FK → users                 | Author                                         |
| title            | text                            |                                                |
| body             | text                            | Plain text or simple markdown                  |
| type             | text                            | `'discussion'` \| `'announcement'` \| `'poll'` |
| poll_options     | jsonb                           | `string[]`, null if not poll                   |
| is_pinned        | boolean                         | Default false. Admin/owner only                |
| is_locked        | boolean                         | Default false. Prevents new replies            |
| reply_count      | int                             | Denormalized counter                           |
| last_activity_at | timestamptz                     | Updated on new reply                           |
| created_at       | timestamptz                     |                                                |

### `club_forum_replies`

| Column     | Type                         | Notes              |
| ---------- | ---------------------------- | ------------------ |
| id         | uuid PK                      |                    |
| thread_id  | uuid FK → club_forum_threads |                    |
| user_id    | uuid FK → users              |                    |
| text       | text                         | Supports @mentions |
| created_at | timestamptz                  |                    |

### `club_forum_poll_votes`

| Column       | Type                         | Notes                         |
| ------------ | ---------------------------- | ----------------------------- |
| id           | uuid PK                      |                               |
| thread_id    | uuid FK → club_forum_threads |                               |
| user_id      | uuid FK → users              |                               |
| option_index | int                          | Index into poll_options array |
| created_at   | timestamptz                  |                               |
| UNIQUE       | (thread_id, user_id)         | One vote per user per poll    |

## RLS Policies

- **Read:** Club members only (join on `club_members`)
- **Insert threads:** Any club member
- **Insert announcements:** Admin/owner only
- **Insert replies:** Any member, thread must not be locked
- **Update/delete threads:** Own threads OR admin/owner/moderator
- **Pin/lock:** Admin/owner only
- **Delete replies:** Own replies OR admin/owner/moderator
- **Categories CRUD:** Admin/owner only

## UI Structure

### Club Page Tabs

Refactor current stacked sections into tabbed layout:

- **Events** tab (default) — current event grid
- **Forum** tab — thread listing
- **Members** tab — current member grid

### Forum Tab

- Category filter bar (horizontal scrollable pills: "All", then each category)
- "New Thread" button (top right)
- Thread list sorted by: pinned first, then last_activity_at desc
- Each thread row shows: title, author avatar+name, category badge, type icon (📌 pinned, 📢 announcement, 📊 poll), reply count, relative time

### Thread Detail Page (`/clubs/[slug]/forum/[threadId]`)

- Back link to club forum
- Thread header: title, author, category badge, type badge, timestamps
- Admin controls bar: pin/unpin, lock/unlock, delete (if authorized)
- Thread body
- Poll widget (if poll type): radio buttons to vote, bar chart of results after voting
- Replies list with @mention highlighting
- Reply composer at bottom (hidden if thread is locked)

### New Thread Form

- Title input
- Category dropdown
- Type selector (Discussion | Announcement | Poll) — Announcement only shown for admin/owner
- Body textarea
- Poll options input (shown only when type=poll): dynamic add/remove option fields, min 2 options
- Submit button

## Components

| Component              | Type          | Description                                     |
| ---------------------- | ------------- | ----------------------------------------------- |
| `ClubTabs`             | client        | Tab switcher for Events/Forum/Members           |
| `ForumThreadList`      | client        | Thread listing with category filter, pagination |
| `ForumThreadCard`      | client        | Single thread preview row                       |
| `ForumThreadDetail`    | server+client | Full thread view with replies                   |
| `ForumReplyComposer`   | client        | Reply text input                                |
| `ForumNewThreadForm`   | client        | Create thread form with type/category/poll      |
| `ForumPollWidget`      | client        | Vote + results display                          |
| `ForumCategoryManager` | client        | Admin UI for managing categories                |
| `ForumAdminControls`   | client        | Pin/lock/delete buttons                         |

## API Routes

| Method | Route                                              | Description                                     |
| ------ | -------------------------------------------------- | ----------------------------------------------- |
| GET    | `/api/clubs/[id]/forum/categories`                 | List categories                                 |
| POST   | `/api/clubs/[id]/forum/categories`                 | Create category (admin)                         |
| DELETE | `/api/clubs/[id]/forum/categories/[catId]`         | Delete category (admin)                         |
| GET    | `/api/clubs/[id]/forum/threads`                    | List threads (supports `?category=slug` filter) |
| POST   | `/api/clubs/[id]/forum/threads`                    | Create thread                                   |
| GET    | `/api/clubs/[id]/forum/threads/[threadId]`         | Get thread + replies                            |
| PATCH  | `/api/clubs/[id]/forum/threads/[threadId]`         | Update thread (edit, pin, lock)                 |
| DELETE | `/api/clubs/[id]/forum/threads/[threadId]`         | Delete thread                                   |
| POST   | `/api/clubs/[id]/forum/threads/[threadId]/replies` | Add reply                                       |
| DELETE | `/api/clubs/[id]/forum/replies/[replyId]`          | Delete reply                                    |
| POST   | `/api/clubs/[id]/forum/threads/[threadId]/vote`    | Cast poll vote                                  |

## Notifications

Two new notification types added to the existing notification system:

- `forum_reply` — "X replied to your thread 'Title'" with href to thread
- `forum_mention` — "X mentioned you in 'Title'" with href to thread

## Permissions

Leverages existing `club_members` roles:

| Action              | owner | admin | moderator | member |
| ------------------- | ----- | ----- | --------- | ------ |
| Create thread       | ✅    | ✅    | ✅        | ✅     |
| Create announcement | ✅    | ✅    | ❌        | ❌     |
| Reply               | ✅    | ✅    | ✅        | ✅     |
| Pin/unpin thread    | ✅    | ✅    | ❌        | ❌     |
| Lock/unlock thread  | ✅    | ✅    | ✅        | ❌     |
| Delete any thread   | ✅    | ✅    | ✅        | ❌     |
| Delete own thread   | ✅    | ✅    | ✅        | ✅     |
| Delete any reply    | ✅    | ✅    | ✅        | ❌     |
| Manage categories   | ✅    | ✅    | ❌        | ❌     |

## Tech Stack

- Next.js 15 App Router (server + client components)
- Supabase (tables, RLS, realtime optional)
- Tailwind CSS with existing design system (teal palette, font-heading)
- Existing notification infrastructure
