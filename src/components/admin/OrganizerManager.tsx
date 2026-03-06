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

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export default function OrganizerManager() {
  const [organizers, setOrganizers] = useState<OrganizerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? "Failed to load organizers");
      }
      const data: OrganizerProfile[] = await res.json();
      setOrganizers(data);
      setError(null);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Failed to load organizers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrganizers();
  }, [loadOrganizers]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setLogoFile(file);
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoPreview(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
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
          username: username.trim(),
          logo_url: logoUrl,
        }),
      });

      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? "Failed to create organizer");
      }

      setOrgName("");
      setUsername("");
      setLogoFile(null);
      setLogoPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      await loadOrganizers();
    } catch (error_) {
      setFormError(error_ instanceof Error ? error_.message : "Failed to create organizer");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopyLink(token: string) {
    const link = `${globalThis.location.origin}/claim/${token}`;
    await navigator.clipboard.writeText(link);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleRegenerate(id: string) {
    try {
      const res = await fetch(`/api/admin/organizers/${id}/regenerate`, {
        method: "POST",
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? "Failed to regenerate link");
      }
      await loadOrganizers();
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Failed to regenerate link");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Organizer</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="org-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Organization Name
              </label>
              <input
                id="org-name"
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Trail Masters PH"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              />
            </div>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replaceAll(/[^a-z0-9_-]/g, ""))
                }
                placeholder="e.g. trail-masters"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="logo"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Logo
            </label>
            <div className="flex items-center gap-4">
              {logoPreview && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-12 w-12 rounded-full object-cover"
                />
              )}
              <input
                id="logo"
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 dark:text-gray-400 dark:file:bg-gray-800 dark:file:text-gray-300"
              />
            </div>
          </div>

          {formError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-white hover:bg-lime-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? "Creating..." : "Create Organizer"}
          </button>
        </form>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Organizers List */}
      {organizers.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No organizer profiles yet. Create one above to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Organizer
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Username
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {organizers.map((org) => {
                  const expired = !org.is_claimed && isExpired(org.claim_expires_at);

                  return (
                    <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-950/50">
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
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                              {org.org_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {org.org_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        @{org.users?.username ?? org.pending_username ?? "\u2014"}
                      </td>
                      <td className="px-4 py-3">
                        {org.is_claimed ? (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
                            Claimed
                          </span>
                        ) : expired ? (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/30 dark:text-red-400">
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {org.is_claimed ? (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {org.users?.email ?? "\u2014"}
                            </span>
                          ) : expired ? (
                            <button
                              onClick={() => void handleRegenerate(org.id)}
                              className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                            >
                              Regenerate
                            </button>
                          ) : (
                            org.claim_token && (
                              <button
                                onClick={() => void handleCopyLink(org.claim_token!)}
                                className={cn(
                                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                                  copied === org.claim_token
                                    ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                    : "bg-lime-50 text-lime-700 hover:bg-lime-100 dark:bg-lime-950/30 dark:text-lime-400 dark:hover:bg-lime-950/50",
                                )}
                              >
                                {copied === org.claim_token ? "Copied!" : "Copy Link"}
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
