"use client";

import Image from "next/image";
import { type DragEvent, useCallback, useEffect, useRef, useState } from "react";

import QRCodeDownload from "@/components/admin/QRCodeDownload";
import { uploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";

interface BadgeOption {
  id: string;
  title: string;
  image_url: string | null;
  rarity: string;
  category: string;
}

interface BatchRow {
  id: string;
  badge_id: string;
  name: string;
  quantity: number;
  created_at: string;
  claimed_count: number;
  badges: {
    title: string;
    image_url: string | null;
    rarity: string;
    category: string;
  } | null;
}

interface CodeRow {
  id: string;
  token: string;
  serial_number: number;
  claimed_by: string | null;
  claimed_at: string | null;
  users: { full_name: string; username: string | null; email: string | null } | null;
}

export default function QRBatchManager() {
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [badges, setBadges] = useState<BadgeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form
  const [badgeId, setBadgeId] = useState("");
  const [batchName, setBatchName] = useState("");
  const [quantity, setQuantity] = useState(10);

  // Inline badge creation
  const [creatingNewBadge, setCreatingNewBadge] = useState(false);
  const [newBadgeTitle, setNewBadgeTitle] = useState("");
  const [newBadgeDescription, setNewBadgeDescription] = useState("");
  const [newBadgeRarity, setNewBadgeRarity] = useState<string>("legendary");
  const [newBadgeCategory, setNewBadgeCategory] = useState<string>("special");
  const [newBadgeImageUrl, setNewBadgeImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [draggingImage, setDraggingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Expanded batch codes
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [codesLoading, setCodesLoading] = useState(false);

  const loadBatches = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/qr-batches");
      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? "Failed to load batches");
      }
      const data: BatchRow[] = await res.json();
      setBatches(data);
      setError(null);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Failed to load batches");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBadges = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/qr-batches/badges");
      if (!res.ok) return;
      const data: BadgeOption[] = await res.json();
      setBadges(data);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    void loadBatches();
    void loadBadges();
  }, [loadBatches, loadBadges]);

  async function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    setUploadingImage(true);
    try {
      const url = await uploadImage(file, "badges");
      setNewBadgeImageUrl(url);
    } catch {
      setError("Failed to upload image");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  function handleImageDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDraggingImage(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleImageFile(file);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!batchName.trim() || quantity < 1) return;

    setCreating(true);
    setError(null);

    try {
      let finalBadgeId = badgeId;

      // Create badge first if using inline form
      if (creatingNewBadge) {
        if (!newBadgeTitle.trim()) {
          setError("Badge title is required");
          setCreating(false);
          return;
        }

        const badgeRes = await fetch("/api/badges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newBadgeTitle.trim(),
            description: newBadgeDescription.trim() || null,
            image_url: newBadgeImageUrl.trim() || null,
            rarity: newBadgeRarity,
            category: newBadgeCategory,
          }),
        });

        if (!badgeRes.ok) {
          const data: { error?: string } = await badgeRes.json();
          throw new Error(data.error ?? "Failed to create badge");
        }

        const badgeData: { badge: { id: string } } = await badgeRes.json();
        finalBadgeId = badgeData.badge.id;
      }

      if (!finalBadgeId) {
        setError("Please select or create a badge");
        setCreating(false);
        return;
      }

      const res = await fetch("/api/admin/qr-batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badge_id: finalBadgeId, name: batchName.trim(), quantity }),
      });

      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? "Failed to create batch");
      }

      // Reset form
      setBadgeId("");
      setBatchName("");
      setQuantity(10);
      setCreatingNewBadge(false);
      setNewBadgeTitle("");
      setNewBadgeDescription("");
      setNewBadgeRarity("legendary");
      setNewBadgeCategory("special");
      setNewBadgeImageUrl("");
      setShowCreate(false);
      await loadBatches();
      await loadBadges();
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Failed to create batch");
    } finally {
      setCreating(false);
    }
  }

  async function handleViewCodes(batchId: string) {
    if (expandedBatchId === batchId) {
      setExpandedBatchId(null);
      setCodes([]);
      return;
    }

    setExpandedBatchId(batchId);
    setCodesLoading(true);

    try {
      const res = await fetch(`/api/admin/qr-batches/${batchId}/codes`);
      if (!res.ok) throw new Error("Failed to load codes");
      const data: { codes: CodeRow[] } = await res.json();
      setCodes(data.codes);
    } catch {
      setCodes([]);
    } finally {
      setCodesLoading(false);
    }
  }

  const rarityColors: Record<string, string> = {
    common: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    rare: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    epic: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    legendary: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Create batch */}
      <div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-lime-400"
        >
          {showCreate ? "Cancel" : "Generate QR Codes"}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
        >
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Create QR Code Batch
          </h3>

          {/* Badge selection */}
          <div className="mb-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Badge
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCreatingNewBadge(false)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  creatingNewBadge
                    ? "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    : "bg-lime-500 text-gray-900",
                )}
              >
                Choose Existing
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatingNewBadge(true);
                  setBadgeId("");
                }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  creatingNewBadge
                    ? "bg-lime-500 text-gray-900"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800",
                )}
              >
                + Create New Badge
              </button>
            </div>

            {creatingNewBadge ? (
              <div className="space-y-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800/50">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                      Badge Title
                    </label>
                    <input
                      type="text"
                      value={newBadgeTitle}
                      onChange={(e) => setNewBadgeTitle(e.target.value)}
                      placeholder="e.g., Founder's Mark"
                      required={creatingNewBadge}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                      Badge Image
                    </label>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleImageFile(file);
                      }}
                    />
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDraggingImage(true);
                      }}
                      onDragLeave={() => setDraggingImage(false)}
                      onDrop={handleImageDrop}
                      onClick={() => !uploadingImage && imageInputRef.current?.click()}
                      className={cn(
                        "flex h-[38px] cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm transition-all",
                        newBadgeImageUrl
                          ? "border-lime-300 bg-lime-50 dark:border-lime-800 dark:bg-lime-950/20"
                          : draggingImage
                            ? "border-teal-400 bg-teal-50/50 dark:border-teal-500 dark:bg-teal-950/20"
                            : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500",
                        uploadingImage && "pointer-events-none opacity-60",
                      )}
                    >
                      {uploadingImage ? (
                        <span className="text-gray-500 dark:text-gray-400">Uploading...</span>
                      ) : newBadgeImageUrl ? (
                        <div className="flex items-center gap-2">
                          <Image
                            src={newBadgeImageUrl}
                            alt="Badge preview"
                            width={24}
                            height={24}
                            className="h-6 w-6 rounded object-cover"
                          />
                          <span className="text-gray-700 dark:text-gray-300">Uploaded</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewBadgeImageUrl("");
                            }}
                            className="ml-auto text-gray-400 hover:text-red-500"
                          >
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                          Drop image or click to upload
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newBadgeDescription}
                    onChange={(e) => setNewBadgeDescription(e.target.value)}
                    placeholder="Awarded to founding members"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                      Rarity
                    </label>
                    <select
                      value={newBadgeRarity}
                      onChange={(e) => setNewBadgeRarity(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="common">Common</option>
                      <option value="rare">Rare</option>
                      <option value="epic">Epic</option>
                      <option value="legendary">Legendary</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                      Category
                    </label>
                    <select
                      value={newBadgeCategory}
                      onChange={(e) => setNewBadgeCategory(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="special">Special</option>
                      <option value="distance">Distance</option>
                      <option value="adventure">Adventure</option>
                      <option value="location">Location</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <select
                value={badgeId}
                onChange={(e) => setBadgeId(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select a badge...</option>
                {badges.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.rarity})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Edition + quantity */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Edition Name
              </label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="e.g., Mt. Pulag Summit 2026"
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Shown on the claim page, e.g. &quot;#3 of 10 — Mt. Pulag Summit 2026&quot;
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Quantity
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Number of unique QR codes to generate
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="mt-4 rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-lime-400 disabled:opacity-50"
          >
            {creating ? "Generating..." : "Generate QR Codes"}
          </button>
        </form>
      )}

      {/* Batch table */}
      {batches.length === 0 ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
          No QR code batches yet. Create one to get started.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Badge
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Edition
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Rarity
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Claimed
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Created
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {batches.map((batch) => (
                <>
                  <tr key={batch.id}>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {batch.badges?.title ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{batch.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          rarityColors[batch.badges?.rarity ?? "common"],
                        )}
                      >
                        {batch.badges?.rarity ?? "common"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {batch.claimed_count} / {batch.quantity}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {new Date(batch.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleViewCodes(batch.id)}
                        className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        {expandedBatchId === batch.id ? "Hide Codes" : "View Codes"}
                      </button>
                    </td>
                  </tr>
                  {expandedBatchId === batch.id && (
                    <tr key={`${batch.id}-codes`}>
                      <td colSpan={6} className="bg-gray-50 px-4 py-4 dark:bg-gray-800/50">
                        {codesLoading ? (
                          <div className="flex justify-center py-4">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-lime-500 border-t-transparent" />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {codes.map((code) => (
                                <div
                                  key={code.id}
                                  className={cn(
                                    "rounded-lg border p-3",
                                    code.claimed_by
                                      ? "border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/10"
                                      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900",
                                  )}
                                >
                                  <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                      #{code.serial_number} of {batch.quantity}
                                    </span>
                                    {code.claimed_by ? (
                                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        Claimed
                                      </span>
                                    ) : (
                                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                        Available
                                      </span>
                                    )}
                                  </div>

                                  {code.claimed_by && code.users && (
                                    <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">
                                      Claimed by{" "}
                                      <span className="font-medium">
                                        {code.users.username ?? code.users.full_name}
                                      </span>{" "}
                                      on{" "}
                                      {code.claimed_at
                                        ? new Date(code.claimed_at).toLocaleDateString()
                                        : ""}
                                    </p>
                                  )}

                                  {!code.claimed_by && (
                                    <QRCodeDownload
                                      token={code.token}
                                      serialNumber={code.serial_number}
                                      batchName={batch.name}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
