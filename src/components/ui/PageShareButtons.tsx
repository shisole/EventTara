"use client";

import { useCallback, useEffect, useState } from "react";

import { CheckIcon, FacebookIcon, LinkIcon, ShareIcon, XTwitterIcon } from "@/components/icons";

interface PageShareButtonsProps {
  title: string;
  path: string;
}

export default function PageShareButtons({ title, path }: PageShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  const getUrl = useCallback(() => {
    return `${globalThis.location.origin}${path}`;
  }, [path]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
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
        // User cancelled or share failed
      }
    }
  }, [title, getUrl]);

  const btnClass =
    "inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors";

  return (
    <div className="flex items-center gap-1">
      <button onClick={copyLink} className={btnClass} title="Copy link">
        {copied ? (
          <CheckIcon className="w-5 h-5 text-lime-500" />
        ) : (
          <LinkIcon className="w-5 h-5" />
        )}
      </button>

      <button onClick={shareToFacebook} className={btnClass} title="Share on Facebook">
        <FacebookIcon className="w-5 h-5" />
      </button>

      <button onClick={shareToX} className={btnClass} title="Share on X">
        <XTwitterIcon className="w-5 h-5" />
      </button>

      {canNativeShare && (
        <button onClick={nativeShare} className={btnClass} title="Share">
          <ShareIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
