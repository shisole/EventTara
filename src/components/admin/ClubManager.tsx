"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

interface ClubRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  visibility: string;
  created_at: string;
  member_count: number;
  event_count: number;
  owner: { username: string | null; email: string | null } | null;
}

export default function ClubManager() {
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClubs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/clubs");
      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? "Failed to load clubs");
      }
      const data: ClubRow[] = await res.json();
      setClubs(data);
      setError(null);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Failed to load clubs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClubs();
  }, [loadClubs]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {clubs.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No clubs yet. Users can create clubs from the app.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Club
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Members
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Events
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Visibility
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {clubs.map((club) => (
                  <tr key={club.id} className="hover:bg-gray-50 dark:hover:bg-gray-950/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {club.logo_url ? (
                          <Image
                            src={club.logo_url}
                            alt={club.name}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            {club.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {club.name}
                          </span>
                          <p className="text-xs text-gray-400 dark:text-gray-500">/{club.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {club.owner ? `@${club.owner.username ?? club.owner.email}` : "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {club.member_count}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {club.event_count}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          club.visibility === "public"
                            ? "inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400"
                            : "inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400"
                        }
                      >
                        {club.visibility}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
