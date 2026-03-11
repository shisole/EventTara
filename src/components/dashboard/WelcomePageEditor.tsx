"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import PhotoUploader from "@/components/dashboard/PhotoUploader";
import { Button, Input, Toggle } from "@/components/ui";
import { WELCOME_HERO_TEMPLATES } from "@/lib/constants/welcome-hero-templates";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface WelcomePage {
  id: string;
  code: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  hero_image_url: string | null;
  redirect_url: string;
  max_claims: number | null;
  expires_at: string | null;
  is_active: boolean;
  badge_id: string | null;
}

interface Badge {
  id: string;
  title: string;
}

interface WelcomePageEditorProps {
  welcomePage: WelcomePage;
  claimCount: number;
  clubSlug: string;
}

export default function WelcomePageEditor({
  welcomePage,
  claimCount,
  clubSlug,
}: WelcomePageEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState(welcomePage.title);
  const [subtitle, setSubtitle] = useState(welcomePage.subtitle ?? "");
  const [description, setDescription] = useState(welcomePage.description ?? "");
  const [heroImage, setHeroImage] = useState<string | File | null>(
    welcomePage.hero_image_url ?? null,
  );
  const [redirectUrl, setRedirectUrl] = useState(welcomePage.redirect_url);
  const [maxClaims, setMaxClaims] = useState(welcomePage.max_claims?.toString() ?? "");
  const [expiresAt, setExpiresAt] = useState(welcomePage.expires_at?.slice(0, 16) ?? "");
  const [isActive, setIsActive] = useState(welcomePage.is_active);
  const [badgeId, setBadgeId] = useState(welcomePage.badge_id ?? "");

  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("badges")
      .select("id, title")
      .order("title")
      .then(({ data }) => {
        if (data) setBadges(data);
      });
  }, []);

  async function uploadHeroImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "welcome/heroes");

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const json: { url?: string; error?: string } = await res.json();
    if (!res.ok) {
      throw new Error(json.error ?? "Upload failed");
    }
    return json.url!;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Upload hero image if it's a file
      const heroImageUrl = heroImage instanceof File ? await uploadHeroImage(heroImage) : heroImage;

      const res = await fetch(`/api/clubs/${clubSlug}/welcome-page`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          description: description.trim() || null,
          hero_image_url: heroImageUrl,
          redirect_url: redirectUrl.trim() || `/clubs/${clubSlug}`,
          max_claims: maxClaims ? Number.parseInt(maxClaims, 10) : null,
          expires_at: expiresAt || null,
          is_active: isActive,
          badge_id: badgeId || null,
        }),
      });

      if (!res.ok) {
        const json: { error?: string } = await res.json();
        setError(json.error ?? "Failed to update welcome page");
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <fieldset disabled={saving} className="min-w-0 space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-600 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
            Welcome page updated!
          </div>
        )}

        <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-900 dark:shadow-gray-950/30">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-heading font-bold dark:text-white">Welcome Page</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {claimCount} claim{claimCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Title
              </label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subtitle
              </label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Scan to join the crew"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description shown on the welcome page..."
              />
            </div>

            <PhotoUploader
              value={heroImage}
              onChange={(file) => setHeroImage(file)}
              label="Hero Image"
            />

            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Or choose a template</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {WELCOME_HERO_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.url}
                    type="button"
                    aria-pressed={heroImage === tpl.url}
                    onClick={() => setHeroImage(tpl.url)}
                    className={cn(
                      "relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border-2 transition-all focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
                      heroImage === tpl.url
                        ? "border-teal-500 ring-2 ring-teal-500/30"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
                    )}
                  >
                    <Image
                      src={tpl.url}
                      alt={tpl.label}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {tpl.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Redirect URL
              </label>
              <Input
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                placeholder={`/clubs/${clubSlug}`}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Where users go after claiming the welcome page
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-900 dark:shadow-gray-950/30">
          <h2 className="mb-4 text-lg font-heading font-bold dark:text-white">Settings</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Disable to temporarily hide the welcome page
                </p>
              </div>
              <Toggle checked={isActive} onChange={setIsActive} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Max Claims
              </label>
              <Input
                type="number"
                min="0"
                value={maxClaims}
                onChange={(e) => setMaxClaims(e.target.value)}
                placeholder="Unlimited"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Leave empty for unlimited claims
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Expires At
              </label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Leave empty for no expiration
              </p>
            </div>

            {badges.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Award Badge
                </label>
                <select
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                >
                  <option value="">None</option>
                  {badges.map((badge) => (
                    <option key={badge.id} value={badge.id}>
                      {badge.title}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Optionally award a badge when someone claims this page
                </p>
              </div>
            )}
          </div>
        </div>

        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? "Saving..." : "Save Welcome Page"}
        </Button>
      </fieldset>
    </form>
  );
}
