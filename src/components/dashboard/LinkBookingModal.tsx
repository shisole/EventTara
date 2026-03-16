"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface LinkBookingModalProps {
  bookingId: string;
  manualName: string;
  eventId: string;
  onClose: () => void;
}

interface UserResult {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
}

export default function LinkBookingModal({
  bookingId,
  manualName,
  eventId,
  onClose,
}: LinkBookingModalProps) {
  const router = useRouter();
  const [search, setSearch] = useState(manualName);
  const [results, setResults] = useState<UserResult[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const searchUsers = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("users")
        .select("id, full_name, email, avatar_url")
        .or(`full_name.ilike.%${query.trim()}%,email.ilike.%${query.trim()}%`)
        .neq("role", "guest")
        .limit(10);
      setResults(data ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void searchUsers(search);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, searchUsers]);

  async function handleLink() {
    if (!selectedUserId) return;
    setLinking(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/participants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, userId: selectedUserId }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json();
        setError(data.error ?? "Failed to link booking");
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLinking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 dark:shadow-gray-950/30">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold dark:text-white">Link Booking</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Link <strong>{manualName}</strong>&apos;s booking to a registered user.
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="mb-4">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedUserId(null);
            }}
            placeholder="Search by name or email..."
          />
        </div>

        <div className="mb-4 max-h-60 space-y-1 overflow-y-auto">
          {loading && (
            <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
              Searching...
            </p>
          )}
          {!loading && results.length === 0 && search.trim().length >= 2 && (
            <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
              No users found
            </p>
          )}
          {results.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelectedUserId(u.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
                selectedUserId === u.id
                  ? "bg-lime-50 ring-2 ring-lime-500 dark:bg-lime-900/20 dark:ring-lime-400"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800",
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {u.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium dark:text-white">{u.full_name}</p>
                {u.email && (
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleLink} disabled={!selectedUserId || linking} className="flex-1">
            {linking ? "Linking..." : "Link User"}
          </Button>
        </div>
      </div>
    </div>
  );
}
