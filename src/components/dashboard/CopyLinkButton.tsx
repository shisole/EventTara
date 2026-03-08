"use client";

import { useState } from "react";

import { CheckIcon, LinkIcon } from "@/components/icons";
import { Button } from "@/components/ui";

interface CopyLinkButtonProps {
  path: string;
}

export default function CopyLinkButton({ path }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${globalThis.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.append(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" className="gap-2" onClick={handleCopy}>
      {copied ? (
        <>
          <CheckIcon className="h-4 w-4 text-lime-500" />
          Copied!
        </>
      ) : (
        <>
          <LinkIcon className="h-4 w-4" />
          Copy Link
        </>
      )}
    </Button>
  );
}
