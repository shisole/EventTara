# Admin Organizer Claim Flow — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow admins to create organizer profiles with a claim link that organizers use to take ownership of their account.

**Architecture:** Add `claim_token`, `claim_expires_at`, and `is_claimed` columns to `organizer_profiles`. Make `user_id` nullable. Admin creates profiles via `/admin/organizers`. Organizers claim via `/claim/[token]` which creates their auth user and links it.

**Tech Stack:** Next.js 15 App Router, Supabase Auth, R2 image upload, Tailwind CSS

---

### Task 1: Update Database Types

**Files:**

- Modify: `src/lib/supabase/types.ts`

**Step 1: Add claim fields to organizer_profiles type**

In `src/lib/supabase/types.ts`, update the `organizer_profiles` table type. Add `claim_token`, `claim_expires_at`, `is_claimed` to Row, make `user_id` nullable in Row and Insert:

```typescript
organizer_profiles: {
  Row: {
    id: string;
    user_id: string | null;
    org_name: string;
    description: string | null;
    logo_url: string | null;
    payment_info: Json;
    claim_token: string | null;
    claim_expires_at: string | null;
    is_claimed: boolean;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id?: string | null;
    org_name: string;
    description?: string | null;
    logo_url?: string | null;
    payment_info?: Json;
    claim_token?: string | null;
    claim_expires_at?: string | null;
    is_claimed?: boolean;
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string | null;
    org_name?: string;
    description?: string | null;
    logo_url?: string | null;
    payment_info?: Json;
    claim_token?: string | null;
    claim_expires_at?: string | null;
    is_claimed?: boolean;
    created_at?: string;
  };
  Relationships: [];
};
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS (no code uses the new fields yet)

**Step 3: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "feat: add claim fields to organizer_profiles type"
```

**Important:** The user will need to add a Supabase migration to:

1. Add `claim_token UUID UNIQUE`, `claim_expires_at TIMESTAMPTZ`, `is_claimed BOOLEAN DEFAULT false` columns to `organizer_profiles`
2. Make `user_id` nullable (`ALTER COLUMN user_id DROP NOT NULL`)
3. Add RLS policies for the claim flow (public read on claim_token lookup, admin insert/update)

Tell the user they need to run the migration before testing.

---

### Task 2: Admin API — Create & List Organizers

**Files:**

- Create: `src/app/(admin)/api/admin/organizers/route.ts`

**Step 1: Create the API route**

Create `src/app/(admin)/api/admin/organizers/route.ts`:

```typescript
import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("organizer_profiles")
    .select(
      "id, org_name, logo_url, user_id, claim_token, claim_expires_at, is_claimed, created_at, users(username, email)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { org_name, username, logo_url } = body as {
    org_name: string;
    username: string;
    logo_url?: string;
  };

  if (!org_name?.trim() || !username?.trim()) {
    return NextResponse.json({ error: "org_name and username are required" }, { status: 400 });
  }

  // Check username uniqueness in users table
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("username", username.trim().toLowerCase())
    .single();

  if (existingUser) {
    return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
  }

  // Check username uniqueness among unclaimed profiles (stored in a separate check)
  const { data: existingProfile } = await supabase
    .from("organizer_profiles")
    .select("id")
    .eq("org_name", org_name.trim())
    .eq("is_claimed", false)
    .single();

  if (existingProfile) {
    return NextResponse.json(
      { error: "An unclaimed profile with this name already exists" },
      { status: 409 },
    );
  }

  const claimToken = randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: profile, error } = await supabase
    .from("organizer_profiles")
    .insert({
      org_name: org_name.trim(),
      logo_url: logo_url || null,
      claim_token: claimToken,
      claim_expires_at: expiresAt,
      is_claimed: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Store the intended username in a metadata approach — we'll save it
  // as a temporary field. Since organizer_profiles doesn't have a username column,
  // we store it so the claim page can pre-fill it.
  // Actually, username belongs to the users table. We need to store it somewhere
  // for the claim flow. Let's use the description field temporarily or add it
  // to the response. The admin panel will track username -> profile mapping client-side.

  return NextResponse.json({ ...profile, _username: username.trim().toLowerCase() });
}
```

**Wait — username storage problem.** The `organizer_profiles` table doesn't have a `username` column. The username belongs to `users`, but we don't have a user yet. We need to store the intended username somewhere.

**Solution:** Add a `pending_username` column to `organizer_profiles` (nullable string). On claim, it gets used to set the `users.username` and then cleared.

**Revised Step 1: Update types first**

Add `pending_username: string | null` to the `organizer_profiles` Row/Insert/Update types in `src/lib/supabase/types.ts`.

Then in the API route POST, store it:

```typescript
const { data: profile, error } = await supabase
  .from("organizer_profiles")
  .insert({
    org_name: org_name.trim(),
    logo_url: logo_url || null,
    claim_token: claimToken,
    claim_expires_at: expiresAt,
    is_claimed: false,
    pending_username: username.trim().toLowerCase(),
  })
  .select()
  .single();
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/supabase/types.ts src/app/(admin)/api/admin/organizers/route.ts
git commit -m "feat: add admin API for creating/listing organizers"
```

**Migration note for user:** Also add `pending_username TEXT` column to `organizer_profiles`.

---

### Task 3: Admin API — Regenerate Claim Link

**Files:**

- Create: `src/app/(admin)/api/admin/organizers/[id]/regenerate/route.ts`

**Step 1: Create the regenerate route**

```typescript
import { randomUUID } from "crypto";

import { type NextRequest, NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const claimToken = randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("organizer_profiles")
    .update({ claim_token: claimToken, claim_expires_at: expiresAt })
    .eq("id", id)
    .eq("is_claimed", false)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Profile not found or already claimed" }, { status: 404 });
  }

  return NextResponse.json(data);
}
```

**Step 2: Commit**

```bash
git add src/app/(admin)/api/admin/organizers/[id]/regenerate/route.ts
git commit -m "feat: add admin API to regenerate organizer claim link"
```

---

### Task 4: Admin Organizers Page & Client Component

**Files:**

- Create: `src/app/(admin)/admin/organizers/page.tsx`
- Create: `src/components/admin/OrganizerManager.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx` — add nav item
- Modify: `src/app/(admin)/admin/page.tsx` — add overview card

**Step 1: Create the admin page**

Create `src/app/(admin)/admin/organizers/page.tsx`:

```tsx
import OrganizerManager from "@/components/admin/OrganizerManager";

export default function OrganizersPage() {
  return (
    <div>
      <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">
        Organizers
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Create organizer profiles and generate claim links for onboarding.
      </p>
      <OrganizerManager />
    </div>
  );
}
```

**Step 2: Create the client component**

Create `src/components/admin/OrganizerManager.tsx`:

```tsx
"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { uploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";

interface OrganizerProfile {
  id: string;
  org_name: string;
  logo_url: string | null;
  user_id: string | null;
  claim_token: string | null;
  claim_expires_at: string | null;
  is_claimed: boolean;
  pending_username: string | null;
  created_at: string;
  users: { username: string | null; email: string | null } | null;
}

export default function OrganizerManager() {
  const [organizers, setOrganizers] = useState<OrganizerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [orgName, setOrgName] = useState("");
  const [username, setUsername] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadOrganizers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/organizers");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setOrganizers(data);
    } catch {
      setError("Failed to load organizers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrganizers();
  }, [loadOrganizers]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCreating(true);

    try {
      let logoUrl: string | undefined;
      if (logoFile) {
        logoUrl = await uploadImage(logoFile, "organizers/logos");
      }

      const res = await fetch("/api/admin/organizers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_name: orgName.trim(),
          username: username.trim().toLowerCase(),
          logo_url: logoUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Failed to create organizer");
        return;
      }

      // Reset form and reload
      setOrgName("");
      setUsername("");
      setLogoFile(null);
      setLogoPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      await loadOrganizers();
    } catch {
      setFormError("Something went wrong.");
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = async (token: string) => {
    const link = `${window.location.origin}/claim/${token}`;
    await navigator.clipboard.writeText(link);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRegenerate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/organizers/${id}/regenerate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      await loadOrganizers();
    } catch {
      setError("Failed to regenerate link.");
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-48 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 animate-pulse" />
        <div className="h-32 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <form
        onSubmit={handleCreate}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
      >
        <h3 className="font-semibold text-gray-900 dark:text-white">Add Organizer</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Organization Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Panay Trail Collective"
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
              }
              placeholder="e.g. panaytrails"
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Avatar / Logo
          </label>
          <div className="flex items-center gap-4">
            {logoPreview && (
              <Image
                src={logoPreview}
                alt="Logo preview"
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-lime-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-lime-700 hover:file:bg-lime-100 dark:file:bg-lime-950/30 dark:file:text-lime-400"
            />
          </div>
        </div>

        {formError && <p className="text-sm text-red-500">{formError}</p>}

        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lime-600 disabled:opacity-50 transition-colors"
        >
          {creating ? "Creating..." : "Create Organizer"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Organizer list */}
      {organizers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No organizers yet. Create one above.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Organizer
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Username
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {organizers.map((org) => (
                <tr key={org.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {org.logo_url ? (
                        <Image
                          src={org.logo_url}
                          alt={org.org_name}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {org.org_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    @{org.users?.username || org.pending_username || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {org.is_claimed ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
                        Claimed
                      </span>
                    ) : isExpired(org.claim_expires_at) ? (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/30 dark:text-red-400">
                        Expired
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!org.is_claimed && org.claim_token && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCopyLink(org.claim_token!)}
                          className={cn(
                            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                            copied === org.claim_token
                              ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
                          )}
                        >
                          {copied === org.claim_token ? "Copied!" : "Copy Link"}
                        </button>
                        {isExpired(org.claim_expires_at) && (
                          <button
                            onClick={() => handleRegenerate(org.id)}
                            className="rounded-lg bg-lime-100 px-3 py-1.5 text-xs font-medium text-lime-700 hover:bg-lime-200 dark:bg-lime-950/30 dark:text-lime-400 dark:hover:bg-lime-950/50 transition-colors"
                          >
                            Regenerate
                          </button>
                        )}
                      </div>
                    )}
                    {org.is_claimed && org.users?.email && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {org.users.email}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Add nav item to AdminSidebar**

In `src/components/admin/AdminSidebar.tsx`, add to `navItems` array:

```typescript
{ href: "/admin/organizers", label: "Organizers", icon: "users" },
```

Add a new case to `NavIcon`:

```tsx
case "users": {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
      />
    </svg>
  );
}
```

**Step 4: Add overview card**

In `src/app/(admin)/admin/page.tsx`, add to `cards` array:

```typescript
{
  title: "Organizers",
  description: "Create organizer profiles and manage claim links.",
  href: "/admin/organizers",
  count: "Profiles",
},
```

**Step 5: Run typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS

**Step 6: Commit**

```bash
git add src/app/(admin)/admin/organizers/page.tsx src/components/admin/OrganizerManager.tsx src/components/admin/AdminSidebar.tsx src/app/(admin)/admin/page.tsx
git commit -m "feat: add admin organizers page with create form and claim links"
```

---

### Task 5: Claim Page — Token Lookup & Form

**Files:**

- Create: `src/app/(frontend)/claim/[token]/page.tsx`

**Step 1: Create the claim page**

Create `src/app/(frontend)/claim/[token]/page.tsx`:

```tsx
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ClaimForm from "./ClaimForm";

export default async function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("organizer_profiles")
    .select("id, org_name, logo_url, pending_username, claim_expires_at, is_claimed")
    .eq("claim_token", token)
    .single();

  if (!profile) {
    notFound();
  }

  if (profile.is_claimed) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 text-center space-y-3">
          <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-7 h-7 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
            Already Claimed
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This organizer account has already been claimed. You can log in to access your
            dashboard.
          </p>
          <a
            href="/login"
            className="inline-block mt-4 rounded-lg bg-lime-500 px-6 py-2 text-sm font-semibold text-white hover:bg-lime-600 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const isExpired = profile.claim_expires_at && new Date(profile.claim_expires_at) < new Date();

  if (isExpired) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 text-center space-y-3">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-7 h-7 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
            Link Expired
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This claim link has expired. Please contact the admin for a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md">
        <ClaimForm
          profileId={profile.id}
          token={token}
          orgName={profile.org_name}
          logoUrl={profile.logo_url}
          pendingUsername={profile.pending_username}
        />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(frontend)/claim/[token]/page.tsx
git commit -m "feat: add claim page with token lookup and edge case handling"
```

---

### Task 6: Claim Form Client Component

**Files:**

- Create: `src/app/(frontend)/claim/[token]/ClaimForm.tsx`

**Step 1: Create the claim form**

```tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

interface ClaimFormProps {
  profileId: string;
  token: string;
  orgName: string;
  logoUrl: string | null;
  pendingUsername: string | null;
}

export default function ClaimForm({
  profileId,
  token,
  orgName,
  logoUrl,
  pendingUsername,
}: ClaimFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [editedOrgName, setEditedOrgName] = useState(orgName);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/claim/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          org_name: editedOrgName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      // Sign in with the new credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError("Account created but login failed. Please go to login page.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 text-center space-y-3">
        <div className="w-14 h-14 bg-lime-100 dark:bg-lime-900/30 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-7 h-7 text-lime-600 dark:text-lime-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
          Account Claimed!
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={orgName}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover mx-auto"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center mx-auto">
            <span className="text-2xl font-bold text-lime-600 dark:text-lime-400">
              {orgName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
          Claim Your Organizer Account
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Set up your login credentials to start managing events.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="org_name"
          label="Organization Name"
          type="text"
          value={editedOrgName}
          onChange={(e) => setEditedOrgName(e.target.value)}
          required
        />

        {pendingUsername && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <div className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
              @{pendingUsername}
            </div>
          </div>
        )}

        <Input
          id="full_name"
          label="Your Full Name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Juan Dela Cruz"
          required
        />

        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />

        <Input
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 6 characters"
          required
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Setting up..." : "Claim Account"}
        </Button>
      </form>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(frontend)/claim/[token]/ClaimForm.tsx
git commit -m "feat: add claim form client component"
```

---

### Task 7: Claim API Route

**Files:**

- Create: `src/app/(frontend)/api/claim/[token]/route.ts`

**Step 1: Create the claim API**

```typescript
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const body = await request.json();
  const { email, password, full_name, org_name } = body as {
    email: string;
    password: string;
    full_name: string;
    org_name: string;
  };

  if (!email?.trim() || !password || !full_name?.trim() || !org_name?.trim()) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  // 1. Look up the profile by claim token
  const { data: profile, error: profileError } = await supabase
    .from("organizer_profiles")
    .select("id, claim_expires_at, is_claimed, pending_username")
    .eq("claim_token", token)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Invalid claim link" }, { status: 404 });
  }

  if (profile.is_claimed) {
    return NextResponse.json({ error: "This account has already been claimed" }, { status: 400 });
  }

  if (profile.claim_expires_at && new Date(profile.claim_expires_at) < new Date()) {
    return NextResponse.json({ error: "This claim link has expired" }, { status: 400 });
  }

  // 2. Create the auth user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: full_name.trim(),
        role: "organizer",
      },
    },
  });

  if (signUpError) {
    if (signUpError.message?.includes("already registered")) {
      return NextResponse.json({ error: "This email is already registered" }, { status: 409 });
    }
    return NextResponse.json({ error: signUpError.message }, { status: 400 });
  }

  const userId = authData.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }

  // 3. Update users table
  await supabase
    .from("users")
    .update({
      full_name: full_name.trim(),
      role: "organizer" as const,
      username: profile.pending_username,
    })
    .eq("id", userId);

  // 4. Link profile to user and mark as claimed
  const { error: updateError } = await supabase
    .from("organizer_profiles")
    .update({
      user_id: userId,
      org_name: org_name.trim(),
      is_claimed: true,
      claim_token: null,
      claim_expires_at: null,
      pending_username: null,
    })
    .eq("id", profile.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to claim profile" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

**Step 2: Run typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS

**Step 3: Commit**

```bash
git add src/app/(frontend)/api/claim/[token]/route.ts
git commit -m "feat: add claim API route for organizer account setup"
```

---

### Task 8: Integration Testing & Final Verification

**Step 1: Run full checks**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: All PASS

**Step 2: Manual test checklist**

1. Navigate to `/admin/organizers`
2. Fill in org name, username, upload avatar
3. Click "Create Organizer" — should appear in table with "Pending" status
4. Click "Copy Link" — should copy claim URL
5. Open claim URL in incognito — should show claim form with org name and username
6. Fill in full name, email, password, optionally edit org name
7. Click "Claim Account" — should show success and redirect to dashboard
8. Back in admin panel — organizer should show "Claimed" status with email
9. Test expired link: change `claim_expires_at` in DB to past date, verify expired message
10. Test already claimed: visit the same link again, verify "Already Claimed" message

**Step 3: Commit any fixes from testing**

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete admin organizer claim flow"
```

---

## Migration Needed (User Action)

The user must create a Supabase migration with these changes before testing:

```sql
-- Add claim fields to organizer_profiles
ALTER TABLE organizer_profiles
  ADD COLUMN claim_token UUID UNIQUE,
  ADD COLUMN claim_expires_at TIMESTAMPTZ,
  ADD COLUMN is_claimed BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN pending_username TEXT;

-- Make user_id nullable (for unclaimed profiles)
ALTER TABLE organizer_profiles
  ALTER COLUMN user_id DROP NOT NULL;

-- Allow public read access for claim token lookup
-- (Add RLS policy for SELECT where claim_token matches)
```
