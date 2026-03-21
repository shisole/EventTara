"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "tent", label: "Tent" },
  { value: "sleeping_bag", label: "Sleeping Bag" },
  { value: "trekking_poles", label: "Trekking Poles" },
  { value: "bike", label: "Bike" },
  { value: "helmet", label: "Helmet" },
  { value: "backpack", label: "Backpack" },
  { value: "other", label: "Other" },
] as const;

interface RentalItemRow {
  id: string;
  club_id: string;
  name: string;
  category: string;
  description: string | null;
  rental_price: number;
  quantity_total: number;
  image_url: string | null;
  sizes: string[] | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface RentalInventoryManagerProps {
  clubSlug: string;
}

interface FormState {
  name: string;
  category: string;
  description: string;
  rental_price: string;
  quantity_total: string;
  image_url: string;
  sizes: string;
  is_active: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  category: "tent",
  description: "",
  rental_price: "0",
  quantity_total: "1",
  image_url: "",
  sizes: "",
  is_active: true,
};

export default function RentalInventoryManager({ clubSlug }: RentalInventoryManagerProps) {
  const [items, setItems] = useState<RentalItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubSlug]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubSlug}/rentals?include_inactive=true`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      setError("Failed to load rental items");
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setError("");
  };

  const openEditForm = (item: RentalItemRow) => {
    setForm({
      name: item.name,
      category: item.category,
      description: item.description || "",
      rental_price: String(item.rental_price),
      quantity_total: String(item.quantity_total),
      image_url: item.image_url || "",
      sizes: item.sizes ? item.sizes.join(", ") : "",
      is_active: item.is_active,
    });
    setEditingId(item.id);
    setShowForm(true);
    setError("");
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim() || null,
      rental_price: Number.parseFloat(form.rental_price) || 0,
      quantity_total: Number.parseInt(form.quantity_total) || 1,
      image_url: form.image_url.trim() || null,
      sizes: form.sizes.trim()
        ? form.sizes
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : null,
      is_active: form.is_active,
    };

    try {
      const url = editingId
        ? `/api/clubs/${clubSlug}/rentals/${editingId}`
        : `/api/clubs/${clubSlug}/rentals`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      setShowForm(false);
      setEditingId(null);
      await fetchItems();
    } catch {
      setError("Failed to save rental item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Delete this rental item?")) return;

    const prev = items;
    setItems((cur) => cur.filter((i) => i.id !== itemId));

    try {
      const res = await fetch(`/api/clubs/${clubSlug}/rentals/${itemId}`, { method: "DELETE" });
      if (!res.ok) {
        setItems(prev);
        setError("Failed to delete item");
      }
    } catch {
      setItems(prev);
      setError("Failed to delete item");
    }
  };

  const handleToggleActive = async (item: RentalItemRow) => {
    const newActive = !item.is_active;
    setItems((cur) => cur.map((i) => (i.id === item.id ? { ...i, is_active: newActive } : i)));

    try {
      await fetch(`/api/clubs/${clubSlug}/rentals/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newActive }),
      });
    } catch {
      setItems((cur) => cur.map((i) => (i.id === item.id ? { ...i, is_active: !newActive } : i)));
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-bold">Rental Inventory</h2>
        <Button variant="primary" size="sm" onClick={openAddForm}>
          + Add Item
        </Button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 text-sm">
            Dismiss
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-4">
          <h3 className="font-heading font-bold">
            {editingId ? "Edit Rental Item" : "Add Rental Item"}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. 2-Person Tent"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Price (₱)
              </label>
              <input
                type="number"
                min="0"
                value={form.rental_price}
                onChange={(e) => setForm({ ...form, rental_price: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Quantity
              </label>
              <input
                type="number"
                min="1"
                value={form.quantity_total}
                onChange={(e) => setForm({ ...form, quantity_total: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the item..."
                rows={2}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Image URL
              </label>
              <input
                type="text"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sizes (comma-separated)
              </label>
              <input
                type="text"
                value={form.sizes}
                onChange={(e) => setForm({ ...form, sizes: e.target.value })}
                placeholder="S, M, L, XL"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Active (visible to participants)
            </span>
          </label>

          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Add Item"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Item list */}
      {items.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">No rental items yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Add gear that participants can rent during event bookings
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-4 rounded-xl border p-4 transition-colors",
                item.is_active
                  ? "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                  : "border-gray-200 bg-gray-50 opacity-60 dark:border-gray-700 dark:bg-gray-800/50",
              )}
            >
              {/* Thumbnail */}
              {item.image_url ? (
                <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg dark:bg-gray-800">
                  {item.category === "tent" ? "⛺" : item.category === "bike" ? "🚲" : "🏕️"}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {CATEGORIES.find((c) => c.value === item.category)?.label} &middot; ₱
                  {item.rental_price.toLocaleString()} &middot; Qty: {item.quantity_total}
                  {item.sizes && item.sizes.length > 0 && ` · Sizes: ${item.sizes.join(", ")}`}
                  {!item.is_active && " · Inactive"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleActive(item)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title={item.is_active ? "Deactivate" : "Activate"}
                >
                  {item.is_active ? "Hide" : "Show"}
                </button>
                <button
                  onClick={() => openEditForm(item)}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-xs text-red-500 hover:text-red-600 dark:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
