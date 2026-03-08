"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

interface ClubLinkProps {
  clubSlug: string;
  clubName: string;
  clubLogoUrl?: string | null;
}

export default function ClubLink({ clubSlug, clubName, clubLogoUrl }: ClubLinkProps) {
  const router = useRouter();

  return (
    <span
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/clubs/${clubSlug}`);
      }}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500",
        "hover:text-lime-600 dark:hover:text-lime-400 cursor-pointer transition-colors",
      )}
    >
      {clubLogoUrl ? (
        <Image
          src={clubLogoUrl}
          alt={clubName}
          width={16}
          height={16}
          className="rounded-full object-cover w-4 h-4"
        />
      ) : (
        <span className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[8px] font-bold text-gray-500 dark:text-gray-400">
          {clubName.charAt(0).toUpperCase()}
        </span>
      )}
      {clubName}
    </span>
  );
}
