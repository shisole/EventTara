"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

interface PollVote {
  option_index: number;
  count: number;
}

interface ForumPollWidgetProps {
  clubSlug: string;
  threadId: string;
  options: string[];
  votes: PollVote[];
  userVote: number | null;
}

export default function ForumPollWidget({
  clubSlug,
  threadId,
  options,
  votes,
  userVote: initialUserVote,
}: ForumPollWidgetProps) {
  const [userVote, setUserVote] = useState<number | null>(initialUserVote);
  const [pollVotes, setPollVotes] = useState<PollVote[]>(votes);
  const [voting, setVoting] = useState(false);

  const totalVotes = pollVotes.reduce((sum, v) => sum + v.count, 0);
  const hasVoted = userVote !== null;

  const getVoteCount = (index: number) =>
    pollVotes.find((v) => v.option_index === index)?.count ?? 0;

  const handleVote = async (optionIndex: number) => {
    setVoting(true);
    const res = await fetch(`/api/clubs/${clubSlug}/forum/threads/${threadId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ option_index: optionIndex }),
    });

    if (res.ok) {
      const newVotes = [...pollVotes];
      if (userVote !== null) {
        const oldIdx = newVotes.findIndex((v) => v.option_index === userVote);
        if (oldIdx !== -1) {
          newVotes[oldIdx] = {
            ...newVotes[oldIdx],
            count: Math.max(0, newVotes[oldIdx].count - 1),
          };
        }
      }
      const newIdx = newVotes.findIndex((v) => v.option_index === optionIndex);
      if (newIdx === -1) {
        newVotes.push({ option_index: optionIndex, count: 1 });
      } else {
        newVotes[newIdx] = { ...newVotes[newIdx], count: newVotes[newIdx].count + 1 };
      }
      setPollVotes(newVotes);
      setUserVote(optionIndex);
    }
    setVoting(false);
  };

  return (
    <div className="space-y-2 my-4">
      {options.map((option, i) => {
        const count = getVoteCount(i);
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const isSelected = userVote === i;

        return (
          <button
            key={i}
            onClick={() => handleVote(i)}
            disabled={voting}
            className={cn(
              "w-full text-left rounded-lg border px-4 py-2.5 text-sm transition-colors relative overflow-hidden",
              isSelected
                ? "border-teal-500 dark:border-teal-600"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
            )}
          >
            {hasVoted && (
              <div
                className="absolute inset-y-0 left-0 bg-teal-50 dark:bg-teal-950/20 transition-all"
                style={{ width: `${String(pct)}%` }}
              />
            )}
            <div className="relative flex justify-between items-center">
              <span className={cn("font-medium", isSelected && "text-teal-700 dark:text-teal-300")}>
                {option}
              </span>
              {hasVoted && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  {pct}% ({count})
                </span>
              )}
            </div>
          </button>
        );
      })}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
      </p>
    </div>
  );
}
