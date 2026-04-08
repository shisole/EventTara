"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, DragHandleButton, Input, SortableList } from "@/components/ui";
import { type ParsedEntry, parseItinerary } from "@/lib/itinerary/parse";
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
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteStep, setPasteStep] = useState<"paste" | "preview">("paste");
  const [parsedEntries, setParsedEntries] = useState<ParsedEntry[]>([]);
  const [pasteSaving, setPasteSaving] = useState(false);
  const [pasteError, setPasteError] = useState("");

  useEffect(() => {
    if (!pasteOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPasteOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [pasteOpen]);

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

  function openPasteModal() {
    setPasteText("");
    setPasteStep("paste");
    setParsedEntries([]);
    setPasteError("");
    setPasteOpen(true);
  }

  function handleParse() {
    const parsed = parseItinerary(pasteText);
    setParsedEntries(parsed);
    setPasteStep("preview");
  }

  function removeParsedEntry(index: number) {
    setParsedEntries((prev) => prev.filter((_, i) => i !== index));
  }

  function updateParsedEntry(index: number, field: "time" | "title", value: string) {
    setParsedEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)),
    );
  }

  async function handlePasteSave() {
    const valid = parsedEntries
      .filter((e) => e.title.trim())
      .map((e) => ({ time: e.time.trim(), title: e.title.trim() }));
    if (valid.length === 0) return;

    setPasteSaving(true);
    setPasteError("");

    try {
      const res = await fetch(`/api/events/${eventId}/itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: valid }),
      });

      if (!res.ok) {
        const json: { error?: string } = await res.json().catch(() => ({}));
        setPasteError(json.error ?? "Failed to save entries.");
        return;
      }

      const json: { entries: ItineraryEntry[] } = await res.json();
      setEntries((prev) => {
        const byId = new Map(prev.map((e) => [e.id, e]));
        for (const e of json.entries) byId.set(e.id, e);
        return [...byId.values()].sort((a, b) => a.sort_order - b.sort_order);
      });
      setPasteOpen(false);
      router.refresh();
    } catch (error_) {
      console.error("Error saving itinerary entries:", error_);
      setPasteError("Failed to save entries.");
    } finally {
      setPasteSaving(false);
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
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Add Entry
          </p>
          <Button variant="outline" size="sm" onClick={openPasteModal}>
            Paste Itinerary
          </Button>
        </div>
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

      {pasteOpen && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPasteOpen(false);
          }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-heading font-bold text-lg">
                {pasteStep === "paste" ? "Paste Itinerary" : "Preview Entries"}
              </h3>
              <button
                type="button"
                onClick={() => setPasteOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {pasteStep === "paste" ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Paste your itinerary below, one entry per line:
                  </p>
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={
                      "4:00 AM - Assembly at trailhead\n5:00 AM - Start hike\n8:00 AM - Summit\n12:00 PM - Back at basecamp"
                    }
                    rows={8}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-gray-200 resize-none"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const newCount = parsedEntries.filter(
                      (e) => e.title.trim() && !entries.some((ex) => ex.time === e.time.trim()),
                    ).length;
                    const updateCount = parsedEntries.filter(
                      (e) => e.title.trim() && entries.some((ex) => ex.time === e.time.trim()),
                    ).length;
                    return (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {newCount > 0 && (
                          <span className="text-teal-600 dark:text-teal-400 font-medium">
                            {newCount} new
                          </span>
                        )}
                        {newCount > 0 && updateCount > 0 && ", "}
                        {updateCount > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {updateCount} {updateCount === 1 ? "update" : "updates"}
                          </span>
                        )}
                      </p>
                    );
                  })()}
                  {parsedEntries.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No entries parsed. Go back and try again.
                    </p>
                  )}
                  {parsedEntries.map((entry, i) => {
                    const isUpdate =
                      entry.time.trim() && entries.some((ex) => ex.time === entry.time.trim());
                    const isUnparsed = !entry.time;
                    const isSaved = false;
                    const isSaving = pasteSaving;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border p-2 transition-colors",
                          isSaved
                            ? "border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/20 opacity-60"
                            : isSaving
                              ? "border-teal-400 dark:border-teal-500 bg-teal-50 dark:bg-teal-950/30"
                              : isUnparsed
                                ? "border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/20"
                                : isUpdate
                                  ? "border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-800"
                                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
                        )}
                      >
                        <Input
                          value={entry.time}
                          onChange={(e) => updateParsedEntry(i, "time", e.target.value)}
                          placeholder="Time"
                          className="w-24 text-sm"
                          disabled={pasteSaving}
                        />
                        <Input
                          value={entry.title}
                          onChange={(e) => updateParsedEntry(i, "title", e.target.value)}
                          placeholder="Title"
                          className="flex-1 text-sm"
                          disabled={pasteSaving}
                        />
                        {isSaved ? (
                          <span className="text-xs text-teal-600 dark:text-teal-400 whitespace-nowrap">
                            saved
                          </span>
                        ) : isSaving ? (
                          <span className="text-xs text-teal-600 dark:text-teal-400 whitespace-nowrap animate-pulse">
                            saving...
                          </span>
                        ) : isUpdate ? (
                          <span className="text-xs text-amber-600 dark:text-amber-400 whitespace-nowrap">
                            update
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => removeParsedEntry(i)}
                          className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 px-1"
                          aria-label="Remove entry"
                          disabled={pasteSaving}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {pasteError && (
                <p className="text-sm text-red-500 dark:text-red-400 mt-2">{pasteError}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              {pasteStep === "paste" ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setPasteOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleParse}
                    disabled={!pasteText.trim()}
                  >
                    Parse
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPasteStep("paste")}
                    disabled={pasteSaving}
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void handlePasteSave()}
                    disabled={
                      pasteSaving || parsedEntries.filter((e) => e.title.trim()).length === 0
                    }
                  >
                    {pasteSaving
                      ? `Saving ${parsedEntries.filter((e) => e.title.trim()).length} entries...`
                      : "Add to Itinerary"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
