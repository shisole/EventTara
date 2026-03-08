"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui";

interface JoinViaInviteButtonProps {
  clubSlug: string;
  inviteCode: string;
  isLoggedIn: boolean;
  isAlreadyMember: boolean;
}

export default function JoinViaInviteButton({
  clubSlug,
  inviteCode,
  isLoggedIn,
  isAlreadyMember,
}: JoinViaInviteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (isAlreadyMember) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-lime-600 dark:text-lime-400 font-medium">
          You are already a member of this club!
        </p>
        <Link href={`/clubs/${clubSlug}`}>
          <Button variant="primary">View Club</Button>
        </Link>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You need to sign in to join this club
        </p>
        <Link href="/login">
          <Button variant="primary">Sign In to Join</Button>
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 text-lime-600 dark:text-lime-400 font-medium">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
              clipRule="evenodd"
            />
          </svg>
          Welcome to the club!
        </div>
        <Link href={`/clubs/${clubSlug}`}>
          <Button variant="primary">View Club</Button>
        </Link>
      </div>
    );
  }

  const handleJoin = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/clubs/${clubSlug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: inviteCode }),
      });

      if (res.ok) {
        setSuccess(true);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to join club");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
      <Button variant="primary" onClick={handleJoin} disabled={loading}>
        {loading ? "Joining..." : "Join Club"}
      </Button>
    </div>
  );
}
