"use client";

import { useCallback, useEffect, useState } from "react";

import {
  COLOR_PRESET_KEYS,
  type ColorPreset,
  getColorPreset,
} from "@/lib/activity-types/color-presets";
import {
  ACTIVITY_TYPE_CATEGORIES,
  type ActivityTypeCategory,
  type ActivityTypeRow,
} from "@/lib/activity-types/types";
import { cn } from "@/lib/utils";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "_")
    .replaceAll(/^_|_$/g, "");
}

const CATEGORY_BADGE: Record<ActivityTypeCategory, string> = {
  outdoor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  indoor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  fitness: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

// ── Create / Edit Form ──────────────────────────────────────────────────────

interface FormState {
  label: string;
  slug: string;
  short_label: string;
  plural_label: string;
  icon: string;
  color_preset: string;
  supports_distance: boolean;
  category: ActivityTypeCategory;
  sort_order: number;
}

const EMPTY_FORM: FormState = {
  label: "",
  slug: "",
  short_label: "",
  plural_label: "",
  icon: "🏃",
  color_preset: "gray",
  supports_distance: false,
  category: "outdoor",
  sort_order: 0,
};

function ActivityTypeForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial: FormState;
  onSubmit: (form: FormState) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [slugManual, setSlugManual] = useState(initial.slug !== "");

  const set = (patch: Partial<FormState>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      // Auto-generate slug from label unless user edited slug manually
      if ("label" in patch && !slugManual) {
        next.slug = slugify(patch.label ?? "");
      }
      return next;
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 space-y-4">
      {/* Row 1: Label + Slug */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Label
          </label>
          <input
            type="text"
            value={form.label}
            onChange={(e) => set({ label: e.target.value })}
            placeholder="e.g. Mountain Biking"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Slug
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => {
              setSlugManual(true);
              set({ slug: e.target.value });
            }}
            placeholder="e.g. mtb"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Row 2: Short label + Plural label */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Short Label
          </label>
          <input
            type="text"
            value={form.short_label}
            onChange={(e) => set({ short_label: e.target.value })}
            placeholder="e.g. MTB"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Plural Label
          </label>
          <input
            type="text"
            value={form.plural_label}
            onChange={(e) => set({ plural_label: e.target.value })}
            placeholder="e.g. MTB Rides"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Row 3: Icon + Category + Sort order */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Icon (emoji)
          </label>
          <input
            type="text"
            value={form.icon}
            onChange={(e) => set({ icon: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "outdoor" || val === "indoor" || val === "fitness") {
                set({ category: val });
              }
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            {ACTIVITY_TYPE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sort Order
          </label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => set({ sort_order: Number(e.target.value) })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Row 4: Color preset */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Color Preset
        </label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESET_KEYS.map((key) => {
            const preset: ColorPreset = getColorPreset(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => set({ color_preset: key })}
                className={cn(
                  "h-8 w-8 rounded-full transition-all",
                  preset.dot,
                  form.color_preset === key
                    ? "ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-gray-900 scale-110"
                    : "opacity-60 hover:opacity-100",
                )}
                title={key}
              />
            );
          })}
        </div>
      </div>

      {/* Row 5: Supports distance toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.supports_distance}
          onChange={(e) => set({ supports_distance: e.target.checked })}
          className="rounded border-gray-300 text-lime-600 focus:ring-lime-500"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Supports distance tracking</span>
      </label>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => onSubmit(form)}
          disabled={submitting || !form.label || !form.slug}
          className="rounded-lg bg-lime-600 px-4 py-2 text-sm font-medium text-white hover:bg-lime-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main Manager ────────────────────────────────────────────────────────────

export function ActivityTypeManager() {
  const [types, setTypes] = useState<ActivityTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/activity-types");
      if (!res.ok) throw new Error("Failed to load activity types");
      const data: ActivityTypeRow[] = await res.json();
      setTypes(data);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTypes();
  }, [loadTypes]);

  const handleCreate = async (form: FormState) => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/activity-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? "Failed to create");
      }
      setShowCreate(false);
      await loadTypes();
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id: string, form: FormState) => {
    setSaving(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/activity-types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? "Failed to update");
      }
      setEditingId(null);
      await loadTypes();
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Failed to update");
    } finally {
      setSaving(null);
    }
  };

  const handleToggleEnabled = async (row: ActivityTypeRow) => {
    // Optimistic update
    setTypes((prev) => prev.map((t) => (t.id === row.id ? { ...t, enabled: !t.enabled } : t)));
    try {
      const res = await fetch(`/api/admin/activity-types/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !row.enabled }),
      });
      if (!res.ok) {
        // Rollback
        setTypes((prev) => prev.map((t) => (t.id === row.id ? { ...t, enabled: row.enabled } : t)));
        const data: { error?: string } = await res.json();
        setError(data.error ?? "Failed to toggle");
      }
    } catch {
      // Rollback
      setTypes((prev) => prev.map((t) => (t.id === row.id ? { ...t, enabled: row.enabled } : t)));
      setError("Failed to toggle enabled state");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/activity-types/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? "Failed to delete");
      }
      await loadTypes();
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-medium underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Add button */}
      {!showCreate && (
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-lime-600 px-4 py-2 text-sm font-medium text-white hover:bg-lime-700 transition-colors"
        >
          + Add Activity Type
        </button>
      )}

      {/* Create form */}
      {showCreate && (
        <ActivityTypeForm
          initial={EMPTY_FORM}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          submitting={creating}
        />
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Type
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Slug
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Category
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
                Distance
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
                Order
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
                Enabled
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {types.map((row) => {
              if (editingId === row.id) {
                return (
                  <tr key={row.id}>
                    <td colSpan={7} className="p-4">
                      <ActivityTypeForm
                        initial={{
                          label: row.label,
                          slug: row.slug,
                          short_label: row.short_label,
                          plural_label: row.plural_label,
                          icon: row.icon,
                          color_preset: row.color_preset,
                          supports_distance: row.supports_distance,
                          category: row.category,
                          sort_order: row.sort_order,
                        }}
                        onSubmit={(form) => handleUpdate(row.id, form)}
                        onCancel={() => setEditingId(null)}
                        submitting={saving === row.id}
                      />
                    </td>
                  </tr>
                );
              }

              const preset = getColorPreset(row.color_preset);
              return (
                <tr
                  key={row.id}
                  className="bg-white hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-3 w-3 rounded-full", preset.dot)} />
                      <span className="text-lg" title={row.icon}>
                        {row.icon}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">{row.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                    {row.slug}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        CATEGORY_BADGE[row.category] ?? CATEGORY_BADGE.outdoor,
                      )}
                    >
                      {row.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.supports_distance ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                    {row.sort_order}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleEnabled(row)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                        row.enabled ? "bg-lime-500" : "bg-gray-300 dark:bg-gray-600",
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                          row.enabled ? "translate-x-4" : "translate-x-0",
                        )}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingId(row.id)}
                        className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        disabled={deletingId === row.id}
                        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50 transition-colors"
                      >
                        {deletingId === row.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {types.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                  No activity types found. Create one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
