"use client";

import { useState, useCallback } from "react";

import { CheckIcon, FacebookIcon, LinkIcon, ShareIcon, XTwitterIcon } from "@/components/icons";

interface ShareButtonsProps {
  title: string;
  eventId: string;
}

export default function ShareButtons({ title, eventId }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const getUrl = useCallback(() => {
    return `${globalThis.location.origin}/events/${eventId}`;
  }, [eventId]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = getUrl();
      document.body.append(input);
      input.select();
      document.execCommand("copy");
      input.remove();
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [getUrl]);

  const shareToFacebook = useCallback(() => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getUrl())}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400",
    );
  }, [getUrl]);

  const shareToX = useCallback(() => {
    window.open(
      `https://x.com/intent/tweet?url=${encodeURIComponent(getUrl())}&text=${encodeURIComponent(title)}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400",
    );
  }, [getUrl, title]);

  const nativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: getUrl() });
      } catch {
        // User cancelled or share failed — ignore
      }
    }
  }, [title, getUrl]);

  const btnClass =
    "inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors";

  return (
    <div className="flex items-center gap-1">
      {/* Copy link */}
      <button onClick={copyLink} className={btnClass} title="Copy link">
        {copied ? (
          <CheckIcon className="w-5 h-5 text-lime-500" />
        ) : (
          <LinkIcon className="w-5 h-5" />
        )}
      </button>

      {/* Facebook */}
      <button onClick={shareToFacebook} className={btnClass} title="Share on Facebook">
        <FacebookIcon className="w-5 h-5" />
      </button>

      {/* X / Twitter */}
      <button onClick={shareToX} className={btnClass} title="Share on X">
        <XTwitterIcon className="w-5 h-5" />
      </button>

      {/* Native share (mobile) */}
      {typeof navigator !== "undefined" && "share" in navigator && (
        <button onClick={nativeShare} className={btnClass} title="Share">
          <ShareIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
