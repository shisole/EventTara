"use client";

import { useState } from "react";

import { MediaLightbox } from "@/components/ui";

interface ReviewPhotoLightboxProps {
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function ReviewPhotoLightbox({
  photos,
  initialIndex,
  onClose,
}: ReviewPhotoLightboxProps) {
  const [index, setIndex] = useState(initialIndex);

  const items = photos.map((url, i) => ({
    id: String(i),
    url,
    caption: null,
  }));

  return (
    <MediaLightbox items={items} selectedIndex={index} onClose={onClose} onChange={setIndex} />
  );
}
