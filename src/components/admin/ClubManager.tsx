"use client";

import Image from "next/image";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { uploadImage } from "@/lib/upload";

interface ClubRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  visibility: string;
  is_claimed: boolean;
  claim_token: string | null;
  claim_expires_at: string | null;
  created_at: string;
  member_count: number;
  event_count: number;
  owner: { username: string | null; email: string | null } | null;
}

const ACTIVITY_OPTIONS = ["hiking", "mtb", "road_biking", "running", "trail_running"];

function getClaimUrl(token: string) {
  return `${globalThis.location.origin}/claim/${token}`;
}

export default function ClubManager() {
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLogoUrl, setNewLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [newActivityTypes, setNewActivityTypes] = useState<string[]>([]);
  const [newVisibility, setNewVisibility] = useState<"public" | "private">("public");

  const loadClubs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/clubs");
      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? "Failed to load clubs");
      }
      const data: ClubRow[] = await res.json();
      setClubs(data);
      setError(null);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Failed to load clubs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClubs();
  }, [loadClubs]);

  async function handleCopyClaimLink(clubId: string, token: string) {
    await navigator.clipboard.writeText(getClaimUrl(token));
    setCopiedId(clubId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleRegenerateToken(clubId: string) {
    setRegeneratingId(clubId);
    try {
      const res = await fetch(`/api/admin/clubs/${clubId}/claim-token`, { method: "POST" });
      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? "Failed to regenerate token");
      }
      await loadClubs();
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Failed to regenerate token");
    } finally {
      setRegeneratingId(null);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDescription || undefined,
          logo_url: newLogoUrl || undefined,
          activity_types: newActivityTypes,
          visibility: newVisibility,
        }),
      });

      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? "Failed to create club");
      }

      // Reset form and reload
      setNewName("");
      setNewDescription("");
      setNewLogoUrl("");
      setNewActivityTypes([]);
      setNewVisibility("public");
      setShowCreate(false);
      await loadClubs();
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Failed to create club");
    } finally {
      setCreating(false);
    }
  }

  function toggleActivity(activity: string) {
    setNewActivityTypes((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity],
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Create Club Section */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-lime-400 transition-colors"
        >
          {showCreate ? "Cancel" : "Create Club"}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-gray-200 bg-white p-6 space-y-4 dark:border-gray-800 dark:bg-gray-900"
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">New Club</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                minLength={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="Club name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Logo
              </label>
              <div className="flex items-center gap-3">
                {newLogoUrl ? (
                  <Image
                    src={newLogoUrl}
                    alt="Logo preview"
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400 dark:bg-gray-800">
                    —
                  </div>
                )}
                <button
                  type="button"
                  disabled={uploadingLogo}
                  onClick={() => logoInputRef.current?.click()}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {uploadingLogo ? "Uploading..." : newLogoUrl ? "Change" : "Upload"}
                </button>
                {newLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setNewLogoUrl("")}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingLogo(true);
                  try {
                    const url = await uploadImage(file, "clubs/logos");
                    setNewLogoUrl(url);
                  } catch {
                    setError("Failed to upload logo");
                  } finally {
                    setUploadingLogo(false);
                    if (logoInputRef.current) logoInputRef.current.value = "";
                  }
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Description
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Brief description..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Activity Types
            </label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_OPTIONS.map((activity) => (
                <button
                  key={activity}
                  type="button"
                  onClick={() => toggleActivity(activity)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    newActivityTypes.includes(activity)
                      ? "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  {activity.replaceAll("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Visibility
            </label>
            <select
              value={newVisibility}
              onChange={(e) => {
                const value: "public" | "private" =
                  e.target.value === "private" ? "private" : "public";
                setNewVisibility(value);
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-lime-400 transition-colors disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create & Generate Claim Link"}
            </button>
          </div>
        </form>
      )}

      {clubs.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No clubs yet. Create one above or users can create clubs from the app.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Club
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Members
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Events
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Visibility
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {clubs.map((club) => (
                  <tr key={club.id} className="hover:bg-gray-50 dark:hover:bg-gray-950/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {club.logo_url ? (
                          <Image
                            src={club.logo_url}
                            alt={club.name}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            {club.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {club.name}
                          </span>
                          <p className="text-xs text-gray-400 dark:text-gray-500">/{club.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {club.owner ? `@${club.owner.username ?? club.owner.email}` : "\u2014"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          club.is_claimed
                            ? "inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400"
                            : "inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                        }
                      >
                        {club.is_claimed ? "Claimed" : "Unclaimed"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {club.member_count}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {club.event_count}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          club.visibility === "public"
                            ? "inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400"
                            : "inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400"
                        }
                      >
                        {club.visibility}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {!club.is_claimed && club.claim_token && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyClaimLink(club.id, club.claim_token!)}
                            className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                          >
                            {copiedId === club.id ? "Copied!" : "Copy Link"}
                          </button>
                          <button
                            onClick={() => handleRegenerateToken(club.id)}
                            disabled={regeneratingId === club.id}
                            className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                          >
                            {regeneratingId === club.id ? "..." : "Regenerate"}
                          </button>
                        </div>
                      )}
                      {!club.is_claimed && !club.claim_token && (
                        <button
                          onClick={() => handleRegenerateToken(club.id)}
                          disabled={regeneratingId === club.id}
                          className="rounded-md bg-teal-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
                        >
                          {regeneratingId === club.id ? "..." : "Generate Claim Link"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
