"use client";

import Image from "next/image";
import { type DragEvent, type FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { ACTIVITY_TYPES } from "@/lib/constants/activity-types";
import { uploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";

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
  const [draggingLogo, setDraggingLogo] = useState(false);
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

  async function handleLogoFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
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
  }

  function handleLogoDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDraggingLogo(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleLogoFile(file);
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
          className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900"
        >
          {/* Header */}
          <h3 className="text-center text-lg font-heading font-bold text-gray-900 dark:text-white mb-6">
            Create a New Club
          </h3>

          {/* Logo — centered, circular, large (Jakob's Law: familiar avatar pattern) */}
          <div className="flex flex-col items-center mb-8">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDraggingLogo(true);
              }}
              onDragLeave={() => setDraggingLogo(false)}
              onDrop={handleLogoDrop}
              onClick={() => !uploadingLogo && logoInputRef.current?.click()}
              className={cn(
                "relative flex h-32 w-32 cursor-pointer items-center justify-center rounded-full border-2 border-dashed transition-all",
                newLogoUrl
                  ? "border-transparent shadow-lg"
                  : draggingLogo
                    ? "border-teal-400 bg-teal-50/50 dark:border-teal-500 dark:bg-teal-950/20 scale-105"
                    : "border-gray-300 hover:border-teal-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-teal-600 dark:hover:bg-gray-800/50",
                uploadingLogo && "pointer-events-none opacity-60",
              )}
            >
              {newLogoUrl ? (
                <>
                  <Image
                    src={newLogoUrl}
                    alt="Logo preview"
                    width={128}
                    height={128}
                    className="h-32 w-32 rounded-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 hover:bg-black/40 transition-colors">
                    <svg
                      className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                      />
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewLogoUrl("");
                    }}
                    className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs shadow-md hover:bg-red-600 transition-colors"
                    aria-label="Remove logo"
                  >
                    &times;
                  </button>
                </>
              ) : uploadingLogo ? (
                <div className="flex flex-col items-center gap-1.5 text-gray-400">
                  <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span className="text-xs">Uploading...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                    />
                  </svg>
                  <span className="text-xs font-medium">Upload Logo</span>
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleLogoFile(file);
                }}
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Drag &amp; drop or click to upload
            </p>
          </div>

          {/* Identity section (Proximity: name + description grouped) */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Club Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                minLength={2}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                placeholder="e.g. Iloilo Trail Runners"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Description
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors resize-none"
                placeholder="What's your club about?"
              />
            </div>
          </div>

          {/* Settings section (Common Region: grouped with divider) */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5 mb-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Activity Types
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ACTIVITY_TYPES.map((activity) => (
                    <button
                      key={activity}
                      type="button"
                      onClick={() => toggleActivity(activity)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                        newActivityTypes.includes(activity)
                          ? "bg-teal-100 text-teal-800 ring-1 ring-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:ring-teal-800"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
                      )}
                    >
                      {activity.replaceAll("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Visibility
                </label>
                <select
                  value={newVisibility}
                  onChange={(e) => {
                    const value: "public" | "private" =
                      e.target.value === "private" ? "private" : "public";
                    setNewVisibility(value);
                  }}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
          </div>

          {/* CTA — full-width, prominent (Von Restorff + Fitts's Law) */}
          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-xl bg-lime-500 py-3 text-sm font-bold text-gray-900 hover:bg-lime-400 transition-colors disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create & Generate Claim Link"}
          </button>
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
