"use client";

import { useState } from "react";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface WaiverModalProps {
  waiverHtml: string;
  onAccept: () => void;
  onClose: () => void;
}

export default function WaiverModal({ waiverHtml, onAccept, onClose }: WaiverModalProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-gray-100 shadow-2xl dark:bg-gray-800">
        {/* Header — dark bar */}
        <div className="flex items-center justify-between bg-gray-900 px-6 py-4 dark:bg-gray-950">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime-500/15">
              <svg
                className="h-5 w-5 text-lime-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-white">Event Waiver</h2>
              <p className="text-xs text-gray-400">Please read carefully before accepting</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Paper document area */}
        <div className="overflow-y-auto px-6 py-6">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-300">
            {/* Paper top accent */}
            <div className="h-1.5 rounded-t-lg bg-gradient-to-r from-lime-500 via-forest-500 to-teal-500" />
            <div className="px-8 py-6">
              <div
                className="prose prose-sm max-w-none text-gray-800 prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-li:text-gray-700"
                dangerouslySetInnerHTML={{ __html: waiverHtml }}
              />
            </div>
          </div>
        </div>

        {/* Footer — acceptance */}
        <div className="border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
          <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-800"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              I have read and agree to the terms of this waiver
            </span>
          </label>
          <Button
            type="button"
            className={cn("w-full", !agreed && "cursor-not-allowed opacity-50")}
            disabled={!agreed}
            onClick={onAccept}
          >
            Accept Waiver
          </Button>
        </div>
      </div>
    </div>
  );
}
