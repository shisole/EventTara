"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ReviewPromptModal = dynamic(() => import("@/components/reviews/ReviewPromptModal"));

interface ReviewPromptTriggerProps {
  eventId: string;
  eventTitle: string;
}

export default function ReviewPromptTrigger({ eventId, eventTitle }: ReviewPromptTriggerProps) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const key = `reviewDismissed_${eventId}`;
    if (!localStorage.getItem(key)) {
      setShowModal(true);
    }
  }, [eventId]);

  if (!showModal) return null;

  return (
    <ReviewPromptModal
      eventId={eventId}
      eventTitle={eventTitle}
      onClose={() => {
        localStorage.setItem(`reviewDismissed_${eventId}`, "1");
        setShowModal(false);
      }}
    />
  );
}
