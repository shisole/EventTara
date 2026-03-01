"use client";

import { useCallback, useState } from "react";

import { ShareIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  activityId: string;
  userName: string;
  text: string;
}

export default function ShareButton({ activityId, userName, text }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    globalThis.location === undefined ? "" : `${globalThis.location.origin}/post/${activityId}`;

  const handleShare = useCallback(async () => {
    const shareData = {
      title: `${userName} ${text}`,
      url: shareUrl,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  }, [shareUrl, userName, text]);

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 group relative"
    >
      <ShareIcon
        className={cn(
          "w-5 h-5 transition-transform group-active:scale-125",
          "text-gray-400 dark:text-gray-500",
        )}
      />
      {copied && (
        <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">Copied!</span>
      )}
    </button>
  );
}
