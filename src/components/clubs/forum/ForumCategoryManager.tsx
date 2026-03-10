"use client";

import { useCallback, useEffect, useState } from "react";

import { type ForumCategory } from "@/lib/clubs/types";

interface ForumCategoryManagerProps {
  clubSlug: string;
  onCategoryChange?: () => void;
}

export default function ForumCategoryManager({
  clubSlug,
  onCategoryChange,
}: ForumCategoryManagerProps) {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/clubs/${clubSlug}/forum/categories`);
    if (res.ok) {
      const data: { categories: ForumCategory[] } = await res.json();
      setCategories(data.categories);
    }
    setLoading(false);
  }, [clubSlug]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);

    const res = await fetch(`/api/clubs/${clubSlug}/forum/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });

    if (res.ok) {
      setNewName("");
      void fetchCategories();
      onCategoryChange?.();
    }
    setAdding(false);
  };

  const handleDelete = async (categoryId: string) => {
    if (!globalThis.confirm("Delete this category? Threads will become uncategorized.")) return;

    const res = await fetch(`/api/clubs/${clubSlug}/forum/categories/${categoryId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      onCategoryChange?.();
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Forum Categories</h4>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">{cat.name}</span>
              <button
                onClick={() => handleDelete(cat.id)}
                className="text-xs text-gray-400 hover:text-red-500"
              >
                Remove
              </button>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No categories yet. Add one below.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="Category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={50}
          className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  );
}
