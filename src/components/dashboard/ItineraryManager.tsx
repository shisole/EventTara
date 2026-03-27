"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, DragHandleButton, Input, SortableList } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ItineraryEntry {
  id: string;
  time: string;
  title: string;
  sort_order: number;
}

interface ItineraryManagerProps {
  eventId: string;
  initialEntries: ItineraryEntry[];
}

export default function ItineraryManager({ eventId, initialEntries }: ItineraryManagerProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<ItineraryEntry[]>(initialEntries);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    if (!newTime.trim() || !newTitle.trim()) return;
    setSaving(true);
    setError("");

    const res = await fetch(`/api/events/${eventId}/itinerary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time: newTime.trim(), title: newTitle.trim() }),
    });

    if (res.ok) {
      const json: { entry: ItineraryEntry } = await res.json();
      setEntries((prev) => [...prev, json.entry]);
      setNewTime("");
      setNewTitle("");
      router.refresh();
    } else {
      const json: { error?: string } = await res.json();
      setError(json.error ?? "Failed to add entry");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const previous = entries;
    setEntries((prev) => prev.filter((e) => e.id !== id));

    const res = await fetch(`/api/events/${eventId}/itinerary/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.refresh();
    } else {
      setEntries(previous);
      const json: { error?: string } = await res.json();
      setError(json.error ?? "Failed to delete entry");
    }
  }

  function startEdit(entry: ItineraryEntry) {
    setEditingId(entry.id);
    setEditTime(entry.time);
    setEditTitle(entry.title);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTime("");
    setEditTitle("");
    setError("");
  }

  async function handleSaveEdit(id: string) {
    if (!editTime.trim() || !editTitle.trim()) return;
    setSaving(true);
    setError("");

    const res = await fetch(`/api/events/${eventId}/itinerary/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time: editTime.trim(), title: editTitle.trim() }),
    });

    if (res.ok) {
      const json: { entry: ItineraryEntry } = await res.json();
      setEntries((prev) => prev.map((e) => (e.id === id ? json.entry : e)));
      setEditingId(null);
      router.refresh();
    } else {
      const json: { error?: string } = await res.json();
      setError(json.error ?? "Failed to save");
    }
    setSaving(false);
  }

  async function handleReorder(reordered: ItineraryEntry[]) {
    const previous = entries;
    const updated = reordered.map((e, i) => ({ ...e, sort_order: i }));
    setEntries(updated);

    const res = await fetch(`/api/events/${eventId}/itinerary`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: updated.map(({ id, sort_order }) => ({ id, sort_order })) }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      setEntries(previous);
      setError("Failed to reorder");
    }
  }

  return (
    <div className="space-y-4">
      {entries.length > 0 ? (
        <SortableList
          items={entries}
          onReorder={handleReorder}
          renderRow={({ item: entry, dragHandleProps }) => {
            if (editingId === entry.id) {
              return (
                <div className="flex items-center gap-2 border border-teal-400 dark:border-teal-600 rounded-xl p-3 bg-white dark:bg-gray-900">
                  <DragHandleButton dragHandleProps={dragHandleProps} />
                  <Input
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    placeholder="Time"
                    className="w-28 text-sm"
                  />
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Title"
                    className="flex-1 text-sm"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void handleSaveEdit(entry.id)}
                    disabled={saving}
                  >
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              );
            }

            return (
              <div
                className={cn(
                  "flex items-center gap-3 border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-white dark:bg-gray-900",
                )}
              >
                <DragHandleButton dragHandleProps={dragHandleProps} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                    {entry.time}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{entry.title}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => startEdit(entry)}>
                  Edit
                </Button>
                <button
                  type="button"
                  onClick={() => void handleDelete(entry.id)}
                  className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  aria-label="Delete entry"
                >
                  ×
                </button>
              </div>
            );
          }}
        />
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No itinerary entries yet. Add the first one below.
        </p>
      )}

      {/* Add form */}
      <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
          Add Entry
        </p>
        <div className="flex gap-2 items-end flex-wrap sm:flex-nowrap">
          <div className="w-full sm:w-28 shrink-0">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Time</label>
            <Input
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              placeholder="e.g. 4:00 AM"
              className="text-sm"
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Title</label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Assembly at trailhead"
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleAdd();
              }}
            />
          </div>
          <Button
            variant="primary"
            onClick={() => void handleAdd()}
            disabled={saving || !newTime.trim() || !newTitle.trim()}
            className="shrink-0"
          >
            + Add
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
