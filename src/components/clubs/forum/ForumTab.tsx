"use client";

import { useCallback, useEffect, useState } from "react";

import { type ClubRole, type ForumCategory, type ForumThreadWithAuthor } from "@/lib/clubs/types";
import { cn } from "@/lib/utils";

import ForumNewThreadForm from "./ForumNewThreadForm";
import ForumThreadCard from "./ForumThreadCard";

interface ForumTabProps {
  clubId: string;
  clubSlug: string;
  userRole: ClubRole;
}

export default function ForumTab({ clubSlug, userRole }: ForumTabProps) {
  const [threads, setThreads] = useState<ForumThreadWithAuthor[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewThread, setShowNewThread] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (activeCategory) params.set("category", activeCategory);

    const res = await fetch(`/api/clubs/${clubSlug}/forum/threads?${params.toString()}`);
    if (res.ok) {
      const data: {
        threads: ForumThreadWithAuthor[];
        totalPages: number;
      } = await res.json();
      setThreads(data.threads);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [clubSlug, page, activeCategory]);

  const fetchCategories = useCallback(async () => {
    const res = await fetch(`/api/clubs/${clubSlug}/forum/categories`);
    if (res.ok) {
      const data: { categories: ForumCategory[] } = await res.json();
      setCategories(data.categories);
    }
  }, [clubSlug]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    void fetchThreads();
  }, [fetchThreads]);

  const handleThreadCreated = () => {
    setShowNewThread(false);
    setPage(1);
    void fetchThreads();
  };

  const isAdmin = userRole === "owner" || userRole === "admin";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => {
              setActiveCategory(null);
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              !activeCategory
                ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.slug);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                activeCategory === cat.slug
                  ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNewThread(true)}
          className="shrink-0 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          New Thread
        </button>
      </div>

      {showNewThread && (
        <ForumNewThreadForm
          clubSlug={clubSlug}
          categories={categories}
          isAdmin={isAdmin}
          onCreated={handleThreadCreated}
          onCancel={() => setShowNewThread(false)}
        />
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 divide-y divide-gray-100 dark:divide-gray-800">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            Loading threads...
          </div>
        ) : threads.length > 0 ? (
          threads.map((thread) => (
            <ForumThreadCard key={thread.id} thread={thread} clubSlug={clubSlug} />
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 font-medium">No threads yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Start a conversation!</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
