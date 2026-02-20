# Payload CMS Frontend Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire Server Components to read content from Payload CMS globals and collections, replacing hardcoded strings in the layout metadata, footer, and static pages (privacy policy, data deletion).

**Architecture:** Server Components call `getPayloadClient()` to query Payload's Local API (same-process, zero HTTP overhead). The layout reads Site Settings for metadata. The Footer reads the Navigation global. Static pages are served from the Pages collection using Lexical rich text rendering. The Navbar stays hardcoded for now (it's a Client Component with auth logic).

**Tech Stack:** Payload Local API, Next.js 15 Server Components, `@payloadcms/richtext-lexical/react` for rendering rich text

---

### Task 1: Integrate Site Settings into layout metadata

**Files:**
- Modify: `src/app/(frontend)/layout.tsx`

**Step 1: Replace the static metadata export with generateMetadata**

The current layout exports a static `metadata` object. Replace it with a `generateMetadata` function that reads from Payload's Site Settings global.

Replace the metadata export (lines 20-67) with:

```typescript
import { getPayloadClient } from "@/lib/payload/client";

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayloadClient();
  const settings = await payload.findGlobal({ slug: 'site-settings' });

  const siteUrl = settings.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://eventtara.com";
  const defaultTitle = `${settings.siteName} — ${settings.tagline}`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: defaultTitle,
      template: settings.seo?.titleTemplate || "%s — EventTara",
    },
    description: settings.siteDescription,
    keywords: settings.seo?.keywords?.split(",").map((k: string) => k.trim()) || [],
    authors: [{ name: settings.siteName }],
    openGraph: {
      type: "website",
      siteName: settings.siteName,
      title: defaultTitle,
      description: settings.siteDescription,
      locale: settings.seo?.ogLocale || "en_PH",
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: settings.siteDescription,
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
        { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
        { url: "/favicon-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
```

Remove the `const siteUrl` line (line 18) and the old static `metadata` export.

Keep the rest of the layout (fonts, RootLayout component) unchanged.

**Step 2: Verify build passes**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/(frontend)/layout.tsx
git commit -m "feat: integrate payload site-settings into layout metadata"
```

---

### Task 2: Integrate Navigation global into Footer

**Files:**
- Modify: `src/components/layout/Footer.tsx`

**Step 1: Make Footer an async Server Component that reads from Payload**

Replace the entire Footer component with one that fetches from the Navigation global, with hardcoded fallbacks.

```typescript
import Link from "next/link";
import { getPayloadClient } from "@/lib/payload/client";

export default async function Footer() {
  let navigation;
  try {
    const payload = await getPayloadClient();
    navigation = await payload.findGlobal({ slug: 'navigation' });
  } catch {
    navigation = null;
  }

  const footerTagline = navigation?.footer?.tagline || "Tara na! — Your adventure starts here.";
  const sections = navigation?.footer?.sections || [];
  const legalLinks = navigation?.footer?.legalLinks || [];

  // Fallback sections if CMS has no content yet
  const defaultSections = [
    {
      title: "Explore",
      links: [
        { label: "Browse Events", url: "/events" },
        { label: "Hiking", url: "/events?type=hiking" },
        { label: "Mountain Biking", url: "/events?type=mtb" },
        { label: "Running", url: "/events?type=running" },
      ],
    },
    {
      title: "For Organizers",
      links: [
        { label: "Host Your Event", url: "/signup" },
        { label: "Organizer Dashboard", url: "/dashboard" },
      ],
    },
  ];

  const defaultLegalLinks = [
    { label: "Privacy Policy", url: "/privacy-policy" },
    { label: "Data Deletion", url: "/data-deletion" },
  ];

  const displaySections = sections.length > 0 ? sections : defaultSections;
  const displayLegalLinks = legalLinks.length > 0 ? legalLinks : defaultLegalLinks;

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-gray-900 dark:text-white font-heading font-bold text-xl mb-3">
              EventTara
            </h3>
            <p className="text-sm">{footerTagline}</p>
          </div>
          {displaySections.map((section: { title: string; links: { label: string; url: string; id?: string }[]; id?: string }, i: number) => (
            <div key={section.id || i}>
              <h4 className="text-gray-900 dark:text-white font-medium mb-3">
                {section.title}
              </h4>
              <div className="space-y-2 text-sm">
                {section.links?.map((link: { label: string; url: string; id?: string }, j: number) => (
                  <Link
                    key={link.id || j}
                    href={link.url}
                    className="block hover:text-gray-900 dark:hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-sm text-center flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <span>&copy; {new Date().getFullYear()} EventTara. All rights reserved.</span>
          {displayLegalLinks.map((link: { label: string; url: string; id?: string }, i: number) => (
            <Link
              key={link.id || i}
              href={link.url}
              className="hover:text-gray-900 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
```

**Step 2: Verify build passes**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/components/layout/Footer.tsx
git commit -m "feat: integrate payload navigation global into footer"
```

---

### Task 3: Create a dynamic CMS page route

**Files:**
- Create: `src/app/(frontend)/(participant)/[slug]/page.tsx`

**Step 1: Create a catch-all CMS page route**

This route renders pages from the Payload Pages collection by slug. It will handle `/privacy-policy`, `/data-deletion`, and any future CMS-managed pages.

Create `src/app/(frontend)/(participant)/[slug]/page.tsx`:

```typescript
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPayloadClient } from "@/lib/payload/client";
import { RichText } from "@payloadcms/richtext-lexical/react";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "pages",
    where: { slug: { equals: slug }, status: { equals: "published" } },
    limit: 1,
  });

  const page = result.docs[0];
  if (!page) return {};

  return {
    title: page.title,
    description: page.description || undefined,
  };
}

export default async function CMSPage({ params }: Props) {
  const { slug } = await params;
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "pages",
    where: { slug: { equals: slug }, status: { equals: "published" } },
    limit: 1,
  });

  const page = result.docs[0];
  if (!page) notFound();

  const lastUpdated = page.lastUpdatedLabel
    ? new Date(page.lastUpdatedLabel).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {page.title}
      </h1>
      {lastUpdated && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Last updated: {lastUpdated}
        </p>
      )}
      {page.content && (
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <RichText data={page.content} />
        </div>
      )}
    </main>
  );
}
```

**Step 2: Verify build passes**

```bash
npm run build
```

Note: The existing hardcoded `/privacy-policy` and `/data-deletion` routes will still take priority over `[slug]` because they are more specific. We'll remove them in the next task after seeding the CMS content.

**Step 3: Commit**

```bash
git add "src/app/(frontend)/(participant)/[slug]/page.tsx"
git commit -m "feat: add dynamic cms page route for payload pages"
```

---

### Task 4: Seed CMS pages and remove hardcoded static pages

**Files:**
- Delete: `src/app/(frontend)/(participant)/privacy-policy/page.tsx`
- Delete: `src/app/(frontend)/(participant)/data-deletion/page.tsx`

**Step 1: Create a seed script for initial CMS pages**

Create `scripts/seed-cms-pages.ts`:

```typescript
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function seedCMSPages() {
  const payload = await getPayload({ config })

  // Check if pages already exist
  const existing = await payload.find({ collection: 'pages', limit: 100 })
  if (existing.docs.length > 0) {
    console.log('Pages already exist, skipping seed.')
    return
  }

  // Privacy Policy
  await payload.create({
    collection: 'pages',
    data: {
      title: 'Privacy Policy',
      slug: 'privacy-policy',
      description: 'Learn how EventTara collects, uses, and protects your personal information.',
      status: 'published',
      lastUpdatedLabel: '2026-02-20',
      content: {
        root: {
          type: 'root',
          children: [
            {
              type: 'heading',
              tag: 'h2',
              children: [{ type: 'text', text: '1. Introduction' }],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: 'EventTara ("we," "us," or "our") is a Philippine outdoor adventure event booking platform for hiking, mountain biking, road biking, running, and trail running. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.',
                },
              ],
            },
            {
              type: 'heading',
              tag: 'h2',
              children: [{ type: 'text', text: '2. Information We Collect' }],
            },
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'We may collect the following types of information:' },
              ],
            },
            {
              type: 'list',
              listType: 'bullet',
              children: [
                { type: 'listitem', children: [{ type: 'text', text: 'Account information: When you sign up or log in using Facebook or other providers, we receive your name, email address, and profile photo.' }] },
                { type: 'listitem', children: [{ type: 'text', text: 'Profile data: Information you provide to complete your profile, such as your username and contact details.' }] },
                { type: 'listitem', children: [{ type: 'text', text: 'Booking and event activity: Records of events you book, attend, or organize, including check-in data.' }] },
                { type: 'listitem', children: [{ type: 'text', text: 'Badge awards: Badges earned through event participation and achievements.' }] },
                { type: 'listitem', children: [{ type: 'text', text: 'Device and usage data: Browser type, IP address, and pages visited, collected automatically through standard web server logs.' }] },
              ],
            },
            {
              type: 'heading',
              tag: 'h2',
              children: [{ type: 'text', text: '3. How We Use Your Information' }],
            },
            {
              type: 'list',
              listType: 'bullet',
              children: [
                { type: 'listitem', children: [{ type: 'text', text: 'Account creation and authentication: To create and manage your account, including login via Facebook OAuth.' }] },
                { type: 'listitem', children: [{ type: 'text', text: 'Event booking and management: To process your event registrations and provide booking confirmations.' }] },
                { type: 'listitem', children: [{ type: 'text', text: 'Communication: To send transactional emails such as booking confirmations, event updates, and badge award notifications.' }] },
                { type: 'listitem', children: [{ type: 'text', text: 'Badge system: To track and award badges based on your event participation.' }] },
                { type: 'listitem', children: [{ type: 'text', text: 'Service improvement: To understand how our platform is used and improve the user experience.' }] },
              ],
            },
            {
              type: 'heading',
              tag: 'h2',
              children: [{ type: 'text', text: '4. Third-Party Services' }],
            },
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'We use the following third-party services to operate our platform:' },
              ],
            },
            {
              type: 'list',
              listType: 'bullet',
              children: [
                { type: 'listitem', children: [{ type: 'text', text: 'Supabase: For authentication, database storage, and file storage. Your account data and event information are stored securely on Supabase infrastructure.' }] },
                { type: 'listitem', children: [{ type: 'text', text: 'Resend: For sending transactional emails such as booking confirmations and badge award notifications.' }] },
                { type: 'listitem', children: [{ type: 'text', text: 'Facebook Login: If you choose to log in with Facebook, we receive the profile information you authorize. We do not post to your Facebook account or access your friends list.' }] },
              ],
            },
            {
              type: 'heading',
              tag: 'h2',
              children: [{ type: 'text', text: '5. Data Sharing' }],
            },
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'We do not sell, rent, or trade your personal information. Your information may be shared only in the following circumstances:' },
              ],
            },
            {
              type: 'list',
              listType: 'bullet',
              children: [
                { type: 'listitem', children: [{ type: 'text', text: 'Event organizers: When you book an event, the organizer receives your name and contact information necessary to manage the event.' }] },
                { type: 'listitem', children: [{ type: 'text', text: 'Legal requirements: We may disclose information if required by law or in response to valid legal process.' }] },
              ],
            },
            {
              type: 'heading',
              tag: 'h2',
              children: [{ type: 'text', text: '6. Cookies and Session Data' }],
            },
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'We use authentication session cookies managed by Supabase to keep you logged in securely. These cookies are essential for the functioning of the service and are not used for advertising or tracking purposes.' },
              ],
            },
            {
              type: 'heading',
              tag: 'h2',
              children: [{ type: 'text', text: '7. Data Retention and Deletion' }],
            },
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'We retain your personal information for as long as your account is active or as needed to provide our services. If you wish to request deletion of your account and associated data, please contact us at privacy@eventtara.com. We will process your request within 30 days.' },
              ],
            },
            {
              type: 'heading',
              tag: 'h2',
              children: [{ type: 'text', text: '8. Children\'s Privacy' }],
            },
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'Our service is not directed at individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected data from a child under 13, we will take steps to delete that information promptly.' },
              ],
            },
            {
              type: 'heading',
              tag: 'h2',
              children: [{ type: 'text', text: '9. Changes to This Policy' }],
            },
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. We encourage you to review this policy periodically to stay informed about how we protect your information.' },
              ],
            },
            {
              type: 'heading',
              tag: 'h2',
              children: [{ type: 'text', text: '10. Contact Us' }],
            },
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at privacy@eventtara.com.' },
              ],
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      },
    },
  })
  console.log('Created: Privacy Policy')

  // Data Deletion
  await payload.create({
    collection: 'pages',
    data: {
      title: 'Data Deletion Instructions',
      slug: 'data-deletion',
      description: 'Learn how to request deletion of your personal data from EventTara.',
      status: 'published',
      lastUpdatedLabel: '2026-02-20',
      content: {
        root: {
          type: 'root',
          children: [
            {
              type: 'heading',
              tag: 'h2',
              children: [{ type: 'text', text: '1. Introduction' }],
            },
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'At EventTara, we respect your right to control your personal data. You can request deletion of your data at any time by following the instructions below.' },
              ],
            },
            {
              type: 'heading',
              tag: 'h2',
              children: [{ type: 'text', text: '2. What Data We Store' }],
            },
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'When you use EventTara, we may store the following data associated with your account:' },
              ],
            },
            {
              type: 'list',
              listType: 'bullet',
              children: [
                { type: 'listitem', children: [{ type: 'text', text: 'Account information: Your name, email address, and profile photo obtained through Facebook Login or other sign-in methods.' }] },
                { type: 'listitem', children: [{ type: 'text', text: 'Bookings: Records of events you have registered for or booked.' }] },
                { type: 'listitem', children: [{ type: 'text', text: 'Badges: Badges earned through event participation and achievements.' }] },
                { type: 'listitem', children: [{ type: 'text', text: 'Check-ins: Records of event check-ins confirming your attendance.' }] },
              ],
            },
            {
              type: 'heading',
              tag: 'h2',
              children: [{ type: 'text', text: '3. How to Request Data Deletion' }],
            },
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'To request deletion of your data, send an email to privacy@eventtara.com with the subject line "Data Deletion Request" and include the email address associated with your EventTara account.' },
              ],
            },
            {
              type: 'heading',
              tag: 'h2',
              children: [{ type: 'text', text: '4. What Happens Next' }],
            },
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'Once we receive your request, we will verify your identity and process the deletion within 30 days. You will receive a confirmation email when the deletion is complete. Please note that once your data is deleted, this action cannot be undone and you will need to create a new account to use EventTara again.' },
              ],
            },
            {
              type: 'heading',
              tag: 'h2',
              children: [{ type: 'text', text: '5. Removing Facebook Connection' }],
            },
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'In addition to requesting data deletion from us, you can also revoke EventTara\'s access to your Facebook account by going to Facebook Settings > Apps and Websites, finding "EventTara" in the list, and clicking "Remove" to revoke access.' },
              ],
            },
            {
              type: 'heading',
              tag: 'h2',
              children: [{ type: 'text', text: '6. Contact Us' }],
            },
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'If you have any questions about data deletion or our data practices, please contact us at privacy@eventtara.com.' },
              ],
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      },
    },
  })
  console.log('Created: Data Deletion Instructions')

  // Seed navigation
  await payload.updateGlobal({
    slug: 'navigation',
    data: {
      footer: {
        tagline: 'Tara na! — Your adventure starts here.',
        sections: [
          {
            title: 'Explore',
            links: [
              { label: 'Browse Events', url: '/events' },
              { label: 'Hiking', url: '/events?type=hiking' },
              { label: 'Mountain Biking', url: '/events?type=mtb' },
              { label: 'Running', url: '/events?type=running' },
            ],
          },
          {
            title: 'For Organizers',
            links: [
              { label: 'Host Your Event', url: '/signup' },
              { label: 'Organizer Dashboard', url: '/dashboard' },
            ],
          },
        ],
        legalLinks: [
          { label: 'Privacy Policy', url: '/privacy-policy' },
          { label: 'Data Deletion', url: '/data-deletion' },
        ],
      },
    },
  })
  console.log('Seeded: Navigation global')

  console.log('Done!')
  process.exit(0)
}

seedCMSPages().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

Add this script to `package.json`:
```json
"seed:cms": "npx tsx scripts/seed-cms-pages.ts"
```

**Step 2: Run the seed script**

```bash
npm run seed:cms
```

**Step 3: Delete the hardcoded static pages**

```bash
rm -rf src/app/(frontend)/(participant)/privacy-policy
rm -rf src/app/(frontend)/(participant)/data-deletion
```

**Step 4: Verify build passes**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: seed cms pages and remove hardcoded privacy/data-deletion pages"
```

---

### Task 5: End-to-end verification

**Files:** None (runtime verification)

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Verify all pages work**

Test these URLs:
- `http://localhost:3000/` — landing page still works
- `http://localhost:3000/admin` — admin panel with all collections/globals
- `http://localhost:3000/privacy-policy` — served from CMS
- `http://localhost:3000/data-deletion` — served from CMS
- `http://localhost:3000/events` — events page still works

**Step 3: Verify admin editing works**

1. Go to `/admin` → Site Settings → change the tagline
2. Reload the homepage and verify the metadata reflects the change (check page source)
3. Go to `/admin` → Navigation → edit footer tagline
4. Reload any page and verify the footer shows the updated tagline
5. Go to `/admin` → Pages → edit Privacy Policy content
6. Reload `/privacy-policy` and verify the updated content appears

**Step 4: Commit any remaining generated files**

```bash
git add -A
git commit -m "chore: payload generated files after frontend integration"
```

---

## Post-Integration Checklist

- [ ] Layout metadata reads from Site Settings global
- [ ] Footer reads from Navigation global (with fallbacks)
- [ ] Privacy Policy page served from Payload Pages collection
- [ ] Data Deletion page served from Payload Pages collection
- [ ] Dynamic `[slug]` route handles any future CMS pages
- [ ] CMS seed script works and populates initial content
- [ ] Admin panel editing reflects on frontend
- [ ] Build passes cleanly
- [ ] All existing routes unaffected

## Out of Scope (Future Work)

- Landing page hero/CTA strings (complex page with Supabase queries)
- Navbar links (Client Component with auth logic)
- UI string translations (requires i18n setup)
