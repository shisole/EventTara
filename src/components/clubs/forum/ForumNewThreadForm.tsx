"use client";

import { useState } from "react";

import { type ForumCategory, type ForumThreadType } from "@/lib/clubs/types";
import { cn } from "@/lib/utils";

interface ForumNewThreadFormProps {
  clubSlug: string;
  categories: ForumCategory[];
  isAdmin: boolean;
  onCreated: () => void;
  onCancel: () => void;
}

export default function ForumNewThreadForm({
  clubSlug,
  categories,
  isAdmin,
  onCreated,
  onCancel,
}: ForumNewThreadFormProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<ForumThreadType>("discussion");
  const [categoryId, setCategoryId] = useState<string>("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      title: title.trim(),
      body: body.trim(),
      type,
      category_id: categoryId || null,
    };

    if (type === "poll") {
      const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        setError("Polls require at least 2 options");
        setSubmitting(false);
        return;
      }
      payload.poll_options = validOptions;
    }

    const res = await fetch(`/api/clubs/${clubSlug}/forum/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      onCreated();
    } else {
      const data: { error?: string } = await res.json();
      setError(data.error ?? "Failed to create thread");
    }
    setSubmitting(false);
  };

  const threadTypes: { value: ForumThreadType; label: string; adminOnly?: boolean }[] = [
    { value: "discussion", label: "Discussion" },
    { value: "announcement", label: "Announcement", adminOnly: true },
    { value: "poll", label: "Poll" },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5 space-y-4"
    >
      <h3 className="font-heading font-semibold text-gray-900 dark:text-white">New Thread</h3>

      <div className="flex gap-2">
        {threadTypes
          .filter((t) => !t.adminOnly || isAdmin)
          .map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                type === t.value
                  ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
              )}
            >
              {t.label}
            </button>
          ))}
      </div>

      <input
        type="text"
        placeholder="Thread title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        required
      />

      {categories.length > 0 && (
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">No category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      )}

      <textarea
        placeholder="What's on your mind?"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
      />

      {type === "poll" && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Poll Options</p>
          {pollOptions.map((option, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                placeholder={`Option ${String(i + 1)}`}
                value={option}
                onChange={(e) => handlePollOptionChange(i, e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {pollOptions.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemovePollOption(i)}
                  className="text-gray-400 hover:text-red-500 text-sm px-2"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {pollOptions.length < 10 && (
            <button
              type="button"
              onClick={handleAddPollOption}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
            >
              + Add option
            </button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {submitting ? "Creating..." : "Create Thread"}
        </button>
      </div>
    </form>
  );
}
