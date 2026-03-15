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

import { DragHandleButton, SortableList } from "../ui";
import { type SortableRowProps } from "../ui/SortableList";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "_")
    .replaceAll(/^_|_$/g, "");
}

const CATEGORY_BADGE: Record<ActivityTypeCategory, string> = {
  outdoor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  indoor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

// ── Create / Edit Form ──────────────────────────────────────────────────────

interface FormState {
  label: string;
  slug: string;
  short_label: string;
  plural_label: string;
  icon: string;
  image_url: string;
  color_preset: string;
  supports_distance: boolean;
  category: ActivityTypeCategory;
}

const EMPTY_FORM: FormState = {
  label: "",
  slug: "",
  short_label: "",
  plural_label: "",
  icon: "🏃",
  image_url: "",
  color_preset: "gray",
  supports_distance: false,
  category: "outdoor",
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

      {/* Row 3: Icon + Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              if (val === "outdoor" || val === "indoor") {
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
      </div>

      {/* Row 4: Image URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Image URL
        </label>
        <div className="flex gap-3 items-start">
          <input
            type="text"
            value={form.image_url}
            onChange={(e) => set({ image_url: e.target.value })}
            placeholder="https://images.unsplash.com/..."
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          {form.image_url && (
            <img
              src={form.image_url}
              alt="Preview"
              className="h-10 w-10 rounded-lg object-cover shrink-0 border border-gray-200 dark:border-gray-700"
            />
          )}
        </div>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Used for category cards and filter bubbles on the events page.
        </p>
      </div>

      {/* Row 5: Color preset */}
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

// ── Sortable Row ────────────────────────────────────────────────────────────

function ActivityTypeRow({
  item,
  index,
  dragHandleProps,
  editingId,
  saving,
  deletingId,
  onEdit,
  onUpdate,
  onCancelEdit,
  onToggleEnabled,
  onDelete,
}: SortableRowProps<ActivityTypeRow> & {
  editingId: string | null;
  saving: string | null;
  deletingId: string | null;
  onEdit: (id: string) => void;
  onUpdate: (id: string, form: FormState) => void;
  onCancelEdit: () => void;
  onToggleEnabled: (row: ActivityTypeRow) => void;
  onDelete: (id: string) => void;
}) {
  if (editingId === item.id) {
    return (
      <div className="p-2">
        <ActivityTypeForm
          initial={{
            label: item.label,
            slug: item.slug,
            short_label: item.short_label,
            plural_label: item.plural_label,
            icon: item.icon,
            image_url: item.image_url ?? "",
            color_preset: item.color_preset,
            supports_distance: item.supports_distance,
            category: item.category,
          }}
          onSubmit={(form) => onUpdate(item.id, form)}
          onCancel={onCancelEdit}
          submitting={saving === item.id}
        />
      </div>
    );
  }

  const preset = getColorPreset(item.color_preset);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200",
        "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900",
      )}
    >
      {/* Drag handle */}
      <DragHandleButton dragHandleProps={dragHandleProps} />

      {/* Position number */}
      <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-5 text-right shrink-0">
        {index + 1}
      </span>

      {/* Image + Icon + color dot + label */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            className="h-7 w-7 rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-700"
          />
        ) : (
          <span className={cn("h-3 w-3 rounded-full shrink-0", preset.dot)} />
        )}
        <span className="text-lg shrink-0">{item.icon}</span>
        <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
          {item.label}
        </span>
        <span className="font-mono text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
          {item.slug}
        </span>
      </div>

      {/* Category badge */}
      <span
        className={cn(
          "hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
          CATEGORY_BADGE[item.category] ?? CATEGORY_BADGE.outdoor,
        )}
      >
        {item.category}
      </span>

      {/* Distance indicator */}
      <span className="hidden sm:inline text-xs shrink-0">
        {item.supports_distance ? (
          <span className="text-emerald-600 dark:text-emerald-400">dist</span>
        ) : (
          <span className="text-gray-300 dark:text-gray-600">—</span>
        )}
      </span>

      {/* Enabled toggle */}
      <button
        onClick={() => onToggleEnabled(item)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
          item.enabled ? "bg-lime-500" : "bg-gray-300 dark:bg-gray-600",
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
            item.enabled ? "translate-x-4" : "translate-x-0",
          )}
        />
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(item.id)}
          className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(item.id)}
          disabled={deletingId === item.id}
          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50 transition-colors"
        >
          {deletingId === item.id ? "..." : "Delete"}
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
  const [reordering, setReordering] = useState(false);

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

  const handleReorder = useCallback(
    (reordered: ActivityTypeRow[]) => {
      // Optimistic update
      const withOrder = reordered.map((t, i) => ({ ...t, sort_order: i }));
      setTypes(withOrder);

      // Persist each updated sort_order
      setReordering(true);
      const updates = withOrder.map((t, i) =>
        fetch(`/api/admin/activity-types/${t.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: i }),
        }),
      );

      void Promise.all(updates)
        .catch(() => {
          setError("Failed to save new order");
          void loadTypes(); // Rollback
        })
        .finally(() => setReordering(false));
    },
    [loadTypes],
  );

  const handleToggleEnabled = async (row: ActivityTypeRow) => {
    setTypes((prev) => prev.map((t) => (t.id === row.id ? { ...t, enabled: !t.enabled } : t)));
    try {
      const res = await fetch(`/api/admin/activity-types/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !row.enabled }),
      });
      if (!res.ok) {
        setTypes((prev) => prev.map((t) => (t.id === row.id ? { ...t, enabled: row.enabled } : t)));
        const data: { error?: string } = await res.json();
        setError(data.error ?? "Failed to toggle");
      }
    } catch {
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

      {/* Sortable list */}
      <SortableList
        items={types}
        onReorder={handleReorder}
        disabled={reordering}
        renderRow={(props) => (
          <ActivityTypeRow
            {...props}
            editingId={editingId}
            saving={saving}
            deletingId={deletingId}
            onEdit={setEditingId}
            onUpdate={handleUpdate}
            onCancelEdit={() => setEditingId(null)}
            onToggleEnabled={handleToggleEnabled}
            onDelete={handleDelete}
          />
        )}
      />

      {types.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          No activity types found. Create one above.
        </p>
      )}
    </div>
  );
}
