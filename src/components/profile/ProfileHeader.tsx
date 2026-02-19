"use client";

import { Avatar, Button } from "@/components/ui";
import { useState } from "react";

interface ProfileHeaderProps {
  fullName: string;
  username: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export default function ProfileHeader({ fullName, username, avatarUrl, createdAt }: ProfileHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const memberSince = new Date(createdAt).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="text-center space-y-4">
      <Avatar src={avatarUrl} alt={fullName} size="xl" className="mx-auto" />
      <div>
        <h1 className="text-2xl font-heading font-bold">{fullName}</h1>
        {username && <p className="text-gray-500 dark:text-gray-400">@{username}</p>}
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Adventurer since {memberSince}</p>
      </div>
      <Button variant="outline" size="sm" onClick={handleShare}>
        {copied ? "Link Copied!" : "Share Profile"}
      </Button>
    </div>
  );
}
