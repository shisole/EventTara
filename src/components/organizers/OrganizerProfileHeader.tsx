"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui";
import UserAvatar from "@/components/ui/UserAvatar";
import type { BorderTier } from "@/lib/constants/avatar-borders";

interface OrganizerProfileHeaderProps {
  orgName: string;
  logoUrl: string | null;
  description: string | null;
  createdAt: string;
  isOwnProfile?: boolean;
  borderTier?: BorderTier | null;
  borderColor?: string | null;
}

export default function OrganizerProfileHeader({
  orgName,
  logoUrl,
  description,
  createdAt,
  isOwnProfile,
  borderTier,
  borderColor,
}: OrganizerProfileHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    void navigator.clipboard.writeText(globalThis.location.href);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const organizingSince = new Date(createdAt).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="text-center space-y-4">
      <UserAvatar
        src={logoUrl}
        alt={orgName}
        size="xl"
        className="mx-auto"
        borderTier={borderTier}
        borderColor={borderColor}
      />
      <div>
        <h1 className="text-2xl font-heading font-bold">{orgName}</h1>
        {description && <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>}
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Organizing since {organizingSince}
        </p>
      </div>
      <div className="flex items-center justify-center gap-2">
        {isOwnProfile && (
          <Link href="/dashboard/settings">
            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
          </Link>
        )}
        <Button variant="outline" size="sm" onClick={handleShare}>
          {copied ? "Link Copied!" : "Share Profile"}
        </Button>
      </div>
    </div>
  );
}
