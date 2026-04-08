"use client";

import { useEffect, useRef, useState } from "react";

import { ChevronDownIcon } from "@/components/icons";

interface EventDescriptionProps {
  html: string;
}

const COLLAPSED_MAX_HEIGHT = 240;

export default function EventDescription({ html }: EventDescriptionProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    setOverflowing(el.scrollHeight > COLLAPSED_MAX_HEIGHT + 8);
  }, [html]);

  return (
    <div>
      <h2 className="text-xl font-heading font-bold mb-3">About This Event</h2>
      <div className="relative">
        <div
          ref={contentRef}
          style={{
            maxHeight: !expanded && overflowing ? COLLAPSED_MAX_HEIGHT : undefined,
          }}
          className={`prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-a:text-lime-600 dark:prose-a:text-lime-400 overflow-hidden transition-[max-height] duration-300`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {!expanded && overflowing && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white dark:from-gray-950 to-transparent"
          />
        )}
      </div>
      {overflowing && (
        <button
          type="button"
          onClick={() => {
            setExpanded((prev) => !prev);
          }}
          aria-expanded={expanded}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300 transition-colors"
        >
          {expanded ? "Show less" : "Read more"}
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </div>
  );
}
