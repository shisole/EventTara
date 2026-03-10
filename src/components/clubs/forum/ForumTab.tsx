"use client";

import { useCallback, useEffect, useState } from "react";

import { type ClubRole, type ForumCategory, type ForumThreadWithAuthor } from "@/lib/clubs/types";
import { cn } from "@/lib/utils";

import { CATEGORY_COLORS } from "./category-colors";
import ForumCategoryManager from "./ForumCategoryManager";
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
  const [showCategoryManager, setShowCategoryManager] = useState(false);

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
    <div className="flex gap-6">
      {/* Sidebar — hidden on mobile */}
      <aside className="hidden md:block w-52 shrink-0 space-y-4">
        <button
          onClick={() => setShowNewThread(true)}
          className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm py-3 px-4 transition-colors"
        >
          Start a Discussion
        </button>

        <nav className="space-y-0.5">
          <button
            onClick={() => {
              setActiveCategory(null);
              setPage(1);
            }}
            className={cn(
              "flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
              !activeCategory
                ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
            )}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
            All Discussions
          </button>

          {categories.map((cat, index) => {
            const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.slug);
                  setPage(1);
                }}
                className={cn(
                  "flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
                  activeCategory === cat.slug
                    ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
                )}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                {cat.name}
              </button>
            );
          })}
        </nav>

        {isAdmin && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setShowCategoryManager(!showCategoryManager)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              {showCategoryManager ? "Hide" : "Manage Categories"}
            </button>
            {showCategoryManager && (
              <div className="mt-3">
                <ForumCategoryManager clubSlug={clubSlug} onCategoryChange={fetchCategories} />
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile: category select + new thread button */}
        <div className="flex items-center gap-2 mb-4 md:hidden">
          <select
            value={activeCategory ?? ""}
            onChange={(e) => {
              setActiveCategory(e.target.value || null);
              setPage(1);
            }}
            className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          >
            <option value="">All Discussions</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowNewThread(true)}
            className="shrink-0 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm py-2 px-4 transition-colors"
          >
            New Thread
          </button>
        </div>

        {/* New thread form */}
        {showNewThread && (
          <div className="mb-4">
            <ForumNewThreadForm
              clubSlug={clubSlug}
              categories={categories}
              isAdmin={isAdmin}
              onCreated={handleThreadCreated}
              onCancel={() => setShowNewThread(false)}
            />
          </div>
        )}

        {/* Thread list */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-950/30 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
              Loading discussions...
            </div>
          ) : threads.length > 0 ? (
            threads.map((thread) => (
              <ForumThreadCard key={thread.id} thread={thread} clubSlug={clubSlug} />
            ))
          ) : (
            <div className="p-12 text-center">
              <svg
                className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No discussions yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                Be the first to start a conversation!
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
