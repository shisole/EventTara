# Payload CMS Content Collections & Globals — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create Payload CMS globals and collections to manage site settings, navigation, UI strings, and static pages — replacing hardcoded content in the EventTara frontend.

**Architecture:** Content is organized into globals (single-document settings like site metadata, navigation, UI strings) and collections (multi-document content like static pages and media). All content is queried via Payload's Local API in Server Components. Collections and globals are defined as separate files in `src/payload/collections/` and `src/payload/globals/`, then registered in `payload.config.ts`.

**Tech Stack:** Payload CMS 3.x, Lexical rich text editor, Next.js 15 Server Components, Payload Local API

---

### Task 1: Create site-settings global

**Files:**
- Create: `src/payload/globals/site-settings.ts`
- Modify: `src/payload.config.ts` (register the global)

**Step 1: Create the globals directory and site-settings global**

Create `src/payload/globals/site-settings.ts`:

```typescript
import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: 'EventTara',
    },
    {
      name: 'tagline',
      type: 'text',
      required: true,
      defaultValue: 'Tara na! Book Your Next Adventure',
    },
    {
      name: 'siteDescription',
      type: 'textarea',
      required: true,
      defaultValue:
        'EventTara is an adventure event booking platform for hiking, mountain biking, road biking, running, and more. Tara na!',
    },
    {
      name: 'siteUrl',
      type: 'text',
      defaultValue: 'https://eventtara.com',
    },
    {
      name: 'contactEmail',
      type: 'email',
      defaultValue: 'privacy@eventtara.com',
    },
    {
      name: 'copyrightText',
      type: 'text',
      defaultValue: '© {year} EventTara. All rights reserved.',
      admin: {
        description: 'Use {year} as a placeholder for the current year.',
      },
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'titleTemplate',
          type: 'text',
          defaultValue: '%s — EventTara',
          admin: {
            description: 'Use %s as a placeholder for the page title.',
          },
        },
        {
          name: 'keywords',
          type: 'text',
          defaultValue:
            'events, adventure, hiking, mountain biking, road biking, running, trail running, Philippines, outdoor, booking',
          admin: {
            description: 'Comma-separated keywords for SEO.',
          },
        },
        {
          name: 'ogLocale',
          type: 'text',
          defaultValue: 'en_PH',
        },
      ],
    },
  ],
}
```

**Step 2: Register the global in payload.config.ts**

Import `SiteSettings` and add it to the `globals` array in `payload.config.ts`.

**Step 3: Verify build passes**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/payload/globals/site-settings.ts src/payload.config.ts
git commit -m "feat: add site-settings global to payload cms"
```

---

### Task 2: Create navigation global

**Files:**
- Create: `src/payload/globals/navigation.ts`
- Modify: `src/payload.config.ts` (register the global)

**Step 1: Create the navigation global**

Create `src/payload/globals/navigation.ts`:

```typescript
import type { GlobalConfig } from 'payload'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Navigation',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'header',
      type: 'group',
      fields: [
        {
          name: 'links',
          type: 'array',
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
            },
            {
              name: 'url',
              type: 'text',
              required: true,
            },
            {
              name: 'requiresAuth',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Only show this link to logged-in users.',
              },
            },
            {
              name: 'roles',
              type: 'select',
              hasMany: true,
              options: [
                { label: 'Participant', value: 'participant' },
                { label: 'Organizer', value: 'organizer' },
                { label: 'Guest', value: 'guest' },
              ],
              admin: {
                description: 'Show only to these roles. Leave empty for all roles.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'footer',
      type: 'group',
      fields: [
        {
          name: 'tagline',
          type: 'text',
          defaultValue: 'Tara na! — Your adventure starts here.',
        },
        {
          name: 'sections',
          type: 'array',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'links',
              type: 'array',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          name: 'legalLinks',
          type: 'array',
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
            },
            {
              name: 'url',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
```

**Step 2: Register the global in payload.config.ts**

Import `Navigation` and add it to the `globals` array.

**Step 3: Verify build passes**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/payload/globals/navigation.ts src/payload.config.ts
git commit -m "feat: add navigation global to payload cms"
```

---

### Task 3: Create pages collection

**Files:**
- Create: `src/payload/collections/pages.ts`
- Modify: `src/payload.config.ts` (register the collection)

**Step 1: Create the collections directory and pages collection**

Create `src/payload/collections/pages.ts`:

```typescript
import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  label: 'Pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL slug for this page (e.g. "privacy-policy")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Meta description for SEO.',
      },
    },
    {
      name: 'content',
      type: 'richText',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
    {
      name: 'lastUpdatedLabel',
      type: 'date',
      admin: {
        description: 'Displayed "Last updated" date on the page.',
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'MMMM d, yyyy',
        },
      },
    },
  ],
}
```

**Step 2: Register the collection in payload.config.ts**

Import `Pages` and add it to the `collections` array (after `payload-admins`).

**Step 3: Verify build passes**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/payload/collections/pages.ts src/payload.config.ts
git commit -m "feat: add pages collection to payload cms"
```

---

### Task 4: Create media collection

**Files:**
- Create: `src/payload/collections/media.ts`
- Modify: `src/payload.config.ts` (register the collection)

**Step 1: Create the media collection**

Create `src/payload/collections/media.ts`:

```typescript
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  label: 'Media',
  access: {
    read: () => true,
  },
  upload: {
    mimeTypes: ['image/*'],
    staticDir: 'public/media',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Alt text for accessibility.',
      },
    },
  ],
}
```

**Step 2: Create the upload directory**

```bash
mkdir -p public/media
```

**Step 3: Register the collection in payload.config.ts**

Import `Media` and add it to the `collections` array.

**Step 4: Verify build passes**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/payload/collections/media.ts src/payload.config.ts public/media
git commit -m "feat: add media collection to payload cms"
```

---

### Task 5: Create Payload client helper

**Files:**
- Create: `src/lib/payload/client.ts`

**Step 1: Create the Payload Local API helper**

Create `src/lib/payload/client.ts`:

```typescript
import config from '@payload-config'
import { getPayload } from 'payload'

export async function getPayloadClient() {
  return getPayload({ config })
}
```

This helper is used in Server Components and API routes to query Payload content via the Local API (same-process, no HTTP overhead).

**Step 2: Verify build passes**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/lib/payload/client.ts
git commit -m "feat: add payload local api client helper"
```

---

### Task 6: Verify all collections and globals in admin panel

**Files:** None (runtime verification)

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Visit admin panel**

Open `http://localhost:3000/admin`. You should see:
- **Collections:** Payload Admins, Pages, Media
- **Globals:** Site Settings, Navigation

**Step 3: Seed initial content via admin panel**

1. Go to **Site Settings** → fill in site name, tagline, description, etc.
2. Go to **Navigation** → add header links and footer sections
3. Go to **Pages** → create a test page with slug "test"

**Step 4: Verify Payload Local API works**

Test by making a request:
```bash
curl -s http://localhost:3000/api/pages | head -20
```

**Step 5: Commit any Payload-generated files**

```bash
git add -A
git commit -m "chore: payload generated types and migrations"
```

---

## Post-Task Checklist

- [ ] Site Settings global created and accessible in admin
- [ ] Navigation global created with header/footer structure
- [ ] Pages collection created with rich text content support
- [ ] Media collection created with image upload support
- [ ] Payload client helper created at `src/lib/payload/client.ts`
- [ ] All globals and collections visible in `/admin`
- [ ] Build passes cleanly
- [ ] Existing routes unaffected

## Next Phase

Phase 4: Frontend Integration — wire Server Components to read from Payload globals/collections, replacing hardcoded strings in layout, navbar, footer, and static pages.
