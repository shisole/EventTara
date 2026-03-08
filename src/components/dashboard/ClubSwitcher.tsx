"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ChevronDownIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface ClubOption {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  role: string;
}

interface ClubSwitcherProps {
  clubs: ClubOption[];
}

export default function ClubSwitcher({ clubs }: ClubSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Determine which club is currently active from the URL
  const clubPattern = /\/dashboard\/clubs\/([^/]+)/;
  const currentSlug = clubPattern.exec(pathname)?.[1];
  const currentClub = clubs.find((c) => c.slug === currentSlug);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (clubs.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
      >
        {currentClub?.logo_url ? (
          <Image
            src={currentClub.logo_url}
            alt={currentClub.name}
            width={24}
            height={24}
            className="rounded-md object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded-md bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center">
            <span className="text-xs font-bold text-lime-600 dark:text-lime-400">
              {(currentClub?.name ?? "?").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="flex-1 text-sm font-medium dark:text-white truncate">
          {currentClub?.name ?? "Select Club"}
        </span>
        <ChevronDownIcon
          className={cn("w-4 h-4 text-gray-400 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg dark:shadow-gray-950/50 z-50 overflow-hidden">
          {clubs.map((club) => (
            <button
              key={club.id}
              type="button"
              onClick={() => {
                setOpen(false);
                router.push(`/dashboard/clubs/${club.slug}`);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                club.slug === currentSlug &&
                  "bg-lime-50 dark:bg-lime-900/20 text-lime-600 dark:text-lime-400",
              )}
            >
              {club.logo_url ? (
                <Image
                  src={club.logo_url}
                  alt={club.name}
                  width={24}
                  height={24}
                  className="rounded-md object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-md bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-lime-600 dark:text-lime-400">
                    {club.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium dark:text-white truncate">{club.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{club.role}</p>
              </div>
            </button>
          ))}

          <div className="border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/dashboard");
              }}
              className="w-full px-3 py-2.5 text-left text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              All Clubs
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
