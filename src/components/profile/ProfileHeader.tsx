"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { AvatarWithBorder, Button } from "@/components/ui";
import type { BorderTier } from "@/lib/constants/avatar-borders";

const BorderPickerModal = dynamic(() => import("@/components/profile/BorderPickerModal"));

interface ProfileHeaderProps {
  fullName: string;
  username: string | null;
  avatarUrl: string | null;
  createdAt: string;
  isOwnProfile?: boolean;
  activeBorderId?: string | null;
  activeBorderTier?: BorderTier | null;
  activeBorderColor?: string | null;
}

export default function ProfileHeader({
  fullName,
  username,
  avatarUrl,
  createdAt,
  isOwnProfile,
  activeBorderId = null,
  activeBorderTier = null,
  activeBorderColor = null,
}: ProfileHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [currentBorderId, setCurrentBorderId] = useState(activeBorderId);
  const [currentTier, setCurrentTier] = useState(activeBorderTier);
  const [currentColor, setCurrentColor] = useState(activeBorderColor);

  const handleShare = () => {
    void navigator.clipboard.writeText(globalThis.location.href);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const memberSince = new Date(createdAt).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });

  const handleBorderChange = (
    borderId: string | null,
    tier: BorderTier | null,
    color: string | null,
  ) => {
    setCurrentBorderId(borderId);
    setCurrentTier(tier);
    setCurrentColor(color);
  };

  return (
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        <AvatarWithBorder
          src={avatarUrl}
          alt={fullName}
          size="xl"
          borderTier={currentTier}
          borderColor={currentColor}
          onClick={isOwnProfile ? () => setPickerOpen(true) : undefined}
          className={isOwnProfile ? "cursor-pointer" : undefined}
        />
      </div>
      {isOwnProfile && (
        <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2">
          Tap avatar to change border
        </p>
      )}
      <div>
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl font-heading font-bold">{fullName}</h1>
          {isOwnProfile && (
            <span className="inline-flex items-center rounded-full bg-teal-100 dark:bg-teal-900/30 px-2.5 py-0.5 text-xs font-medium text-teal-700 dark:text-teal-300">
              This is you
            </span>
          )}
        </div>
        {username && <p className="text-gray-500 dark:text-gray-400">@{username}</p>}
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Adventurer since {memberSince}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={handleShare}>
        {copied ? "Link Copied!" : "Share Profile"}
      </Button>

      {isOwnProfile && (
        <BorderPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          avatarUrl={avatarUrl}
          fullName={fullName}
          activeBorderId={currentBorderId}
          onBorderChange={handleBorderChange}
        />
      )}
    </div>
  );
}
