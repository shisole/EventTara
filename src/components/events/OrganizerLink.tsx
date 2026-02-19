"use client";

import { useRouter } from "next/navigation";

interface OrganizerLinkProps {
  organizerId: string;
  name: string;
}

export default function OrganizerLink({ organizerId, name }: OrganizerLinkProps) {
  const router = useRouter();

  return (
    <span
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/organizers/${organizerId}`);
      }}
      className="text-xs text-gray-400 dark:text-gray-500 hover:text-lime-600 dark:hover:text-lime-400 cursor-pointer transition-colors"
    >
      by {name}
    </span>
  );
}
