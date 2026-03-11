"use client";

import { useCallback, useEffect, useState } from "react";

import QRCodeDownload from "@/components/admin/QRCodeDownload";
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!badgeId || !batchName.trim() || quantity < 1) return;

    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/qr-batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badge_id: badgeId, name: batchName.trim(), quantity }),
      });

      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? "Failed to create batch");
      }

      setBadgeId("");
      setBatchName("");
      setQuantity(10);
      setShowCreate(false);
      await loadBatches();
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
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Badge
              </label>
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
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Batch Name
              </label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder='e.g., "Mt. Pulag Summit 2026"'
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
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
                  Batch Name
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
