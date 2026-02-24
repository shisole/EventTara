# Payload CMS Installation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Install Payload CMS v3 into EventTara, set up the admin panel at `/admin`, and configure it to use Supabase's Postgres database with schema isolation.

**Architecture:** Payload runs embedded inside the existing Next.js 15 app. A new `(payload)` route group at `src/app/(payload)/` hosts the admin panel and Payload's REST API. Payload uses its own schema (`payload`) in the shared Supabase Postgres database, keeping it isolated from existing Supabase tables. Payload Auth is separate from Supabase Auth — only CMS admins use Payload Auth.

**Tech Stack:** Payload CMS 3.x, @payloadcms/db-postgres, @payloadcms/richtext-lexical, Next.js 15, Supabase Postgres

---

### Task 1: Install Payload packages

**Files:**

- Modify: `package.json`

**Step 1: Install all required Payload packages**

```bash
npm install payload @payloadcms/next @payloadcms/db-postgres @payloadcms/richtext-lexical @payloadcms/ui sharp graphql --legacy-peer-deps
```

Note: `--legacy-peer-deps` is required due to peer dependency constraints between Payload and React 19. The `pg` package is bundled inside `@payloadcms/db-postgres` — do not install separately.

**Step 2: Verify installation**

```bash
node -e "console.log(require('payload/package.json').version)"
```

Expected: A version like `3.76.x` or later.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install payload cms v3 and dependencies"
```

---

### Task 2: Create payload.config.ts

**Files:**

- Create: `src/payload.config.ts`
- Modify: `tsconfig.json` (add `@payload-config` path alias)

**Step 1: Create the Payload config**

Create `src/payload.config.ts`:

```typescript
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: "payload-admins",
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: "payload-admins",
      auth: true,
      admin: {
        useAsTitle: "email",
      },
      fields: [],
    },
  ],
  globals: [],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "CHANGE-ME-IN-PRODUCTION",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
    schemaName: "payload",
  }),
  sharp,
  plugins: [],
});
```

Key decisions:

- `payload-admins` collection slug avoids clash with existing Supabase `users` table
- `schemaName: 'payload'` isolates Payload tables in their own Postgres schema
- `PAYLOAD_SECRET` env var for encryption (must be set in production)
- `DATABASE_URI` env var for the Supabase Postgres direct connection string

**Step 2: Add @payload-config path alias to tsconfig.json**

Add to the `paths` object in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@payload-config": ["./src/payload.config.ts"]
    }
  }
}
```

**Step 3: Commit**

```bash
git add src/payload.config.ts tsconfig.json
git commit -m "feat: add payload cms configuration with postgres adapter"
```

---

### Task 3: Update next.config.mjs

**Files:**

- Modify: `next.config.mjs`

**Step 1: Wrap the config with withPayload**

Update `next.config.mjs` to import and use `withPayload`:

```javascript
import { withPayload } from "@payloadcms/next/withPayload";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : "**.supabase.co";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    if (!supabaseUrl) return [];
    return [
      {
        source: "/storage/:path*",
        destination: `${supabaseUrl}/storage/v1/object/public/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/storage/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig);
```

The only change is adding the `import { withPayload }` at top and wrapping the export with `withPayload(nextConfig)`.

**Step 2: Verify the config loads**

```bash
npm run build 2>&1 | head -20
```

It may fail at this point because the Payload route files don't exist yet — that's expected. We just need to verify the config file itself parses without errors.

**Step 3: Commit**

```bash
git add next.config.mjs
git commit -m "chore: wrap next config with withPayload"
```

---

### Task 4: Create (payload) route group files

**Files:**

- Create: `src/app/(payload)/layout.tsx`
- Create: `src/app/(payload)/custom.scss`
- Create: `src/app/(payload)/admin/[[...segments]]/page.tsx`
- Create: `src/app/(payload)/admin/importMap.js`
- Create: `src/app/(payload)/api/[...slug]/route.ts`
- Create: `src/app/(payload)/api/graphql/route.ts`

**Step 1: Create the directory structure**

```bash
mkdir -p src/app/\(payload\)/admin/\[\[...segments\]\]
mkdir -p src/app/\(payload\)/api/\[...slug\]
mkdir -p src/app/\(payload\)/api/graphql
```

**Step 2: Create `src/app/(payload)/layout.tsx`**

```typescript
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'
import { importMap } from './admin/importMap.js'
import './custom.scss'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
```

**Step 3: Create `src/app/(payload)/custom.scss`**

```scss
/* Add any custom Payload admin styles here */
```

**Step 4: Create `src/app/(payload)/admin/[[...segments]]/page.tsx`**

```typescript
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from "next";
import config from "@payload-config";
import { RootPage, generatePageMetadata } from "@payloadcms/next/views";
import { importMap } from "../importMap.js";

type Args = {
  params: Promise<{
    segments: string[];
  }>;
  searchParams: Promise<{
    [key: string]: string | string[];
  }>;
};

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams });

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config, params, searchParams, importMap });

export default Page;
```

**Step 5: Create `src/app/(payload)/admin/importMap.js`**

```javascript
// This file is auto-generated by Payload during build.
// It will be populated with component imports dynamically.
export const importMap = {};
```

**Step 6: Create `src/app/(payload)/api/[...slug]/route.ts`**

```typescript
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from "@payload-config";
import "@payloadcms/next/css";
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from "@payloadcms/next/routes";

export const GET = REST_GET(config);
export const POST = REST_POST(config);
export const DELETE = REST_DELETE(config);
export const PATCH = REST_PATCH(config);
export const PUT = REST_PUT(config);
export const OPTIONS = REST_OPTIONS(config);
```

**Step 7: Create `src/app/(payload)/api/graphql/route.ts`**

```typescript
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from "@payload-config";
import { GRAPHQL_POST } from "@payloadcms/next/routes";

export const POST = GRAPHQL_POST(config);
```

**Step 8: Commit**

```bash
git add src/app/\(payload\)
git commit -m "feat: add payload admin panel route group"
```

---

### Task 5: Add environment variables

**Files:**

- Modify: `.env.local` (add DATABASE_URI and PAYLOAD_SECRET)
- Modify: `.env.local.example` (add DATABASE_URI and PAYLOAD_SECRET)

**Step 1: Add to .env.local.example**

Append these lines:

```
# Payload CMS
DATABASE_URI=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
PAYLOAD_SECRET=your-payload-secret-min-32-chars
```

Note: Use the **direct connection** (port 5432), NOT the pooler (port 6543). Get this from Supabase Dashboard → Connect → Connection string (URI).

**Step 2: Add to .env.local**

The user must fill in their actual Supabase direct connection string and generate a random secret. Payload secret should be at least 32 characters.

For the secret, generate one with:

```bash
openssl rand -base64 32
```

**Step 3: Commit**

```bash
git add .env.local.example
git commit -m "chore: add payload cms env vars to example"
```

---

### Task 6: Run Payload migration and verify

**Files:** None (runtime verification)

**Step 1: Verify DATABASE_URI is set**

```bash
grep DATABASE_URI .env.local
```

If not set, the user must add their Supabase direct connection string.

**Step 2: Run the build to trigger Payload setup**

```bash
npm run build
```

Payload will create its schema and run migrations during the first build. Watch for:

- "Created 'payload' schema" or similar migration output
- The build should complete successfully
- The admin panel route should appear in the route list

**Step 3: Start dev server and test admin panel**

```bash
npm run dev
```

Visit `http://localhost:3000/admin` — you should see the Payload admin login/setup screen. Create your first admin user.

**Step 4: Verify existing routes still work**

Visit:

- `http://localhost:3000/` — landing page
- `http://localhost:3000/events` — events list
- `http://localhost:3000/login` — login page

All existing routes should work unchanged.

**Step 5: Commit any generated files**

Payload may generate:

- `src/payload-types.ts` (TypeScript types for collections)
- Migration files in a `migrations/` directory

```bash
git add -A
git commit -m "feat: initial payload cms setup with admin panel"
```

---

## Post-Installation Checklist

- [ ] Payload packages installed
- [ ] `payload.config.ts` created with Postgres adapter
- [ ] `next.config.mjs` wrapped with `withPayload`
- [ ] `(payload)` route group with admin panel files
- [ ] `DATABASE_URI` and `PAYLOAD_SECRET` in env vars
- [ ] Build succeeds
- [ ] Admin panel accessible at `/admin`
- [ ] Existing routes unaffected
- [ ] Admin user created

## Next Phase

Phase 3: Create content collections and globals. See `docs/plans/2026-02-20-payload-cms-i18n-design.md`.
