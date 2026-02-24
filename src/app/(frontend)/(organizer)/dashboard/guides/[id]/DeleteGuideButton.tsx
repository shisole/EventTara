"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export default function DeleteGuideButton({ guideId }: { guideId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this guide? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);

    try {
      const res = await fetch(`/api/guides/${guideId}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete guide");
        setDeleting(false);
        return;
      }

      router.push("/dashboard/guides");
      router.refresh();
    } catch {
      alert("Network error. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <Button variant="ghost" onClick={handleDelete} disabled={deleting} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
      {deleting ? "Deleting..." : "Delete Guide"}
    </Button>
  );
}
