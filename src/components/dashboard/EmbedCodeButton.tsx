"use client";

import { useState } from "react";

import { CheckIcon } from "@/components/icons";
import { Button } from "@/components/ui";

interface EmbedCodeButtonProps {
  eventId: string;
}

function generateEmbedCode(origin: string, eventId: string): string {
  const embedUrl = `${origin}/embed/events/${eventId}`;
  return `<iframe src="${embedUrl}" width="400" height="220" frameborder="0" style="border:none;border-radius:12px;overflow:hidden" allowtransparency="true"></iframe>`;
}

export default function EmbedCodeButton({ eventId }: EmbedCodeButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const code = generateEmbedCode(globalThis.location.origin, eventId);
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
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
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M6.28 5.22a.75.75 0 010 1.06L2.56 10l3.72 3.72a.75.75 0 01-1.06 1.06L.97 10.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0zm7.44 0a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L17.44 10l-3.72-3.72a.75.75 0 010-1.06zM11.377 2.011a.75.75 0 01.612.867l-2.5 14.5a.75.75 0 01-1.478-.255l2.5-14.5a.75.75 0 01.866-.612z"
              clipRule="evenodd"
            />
          </svg>
          Embed Code
        </>
      )}
    </Button>
  );
}
