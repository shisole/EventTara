"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  image_url: string;
  caption: string | null;
}

export default function EventGallery({ photos }: { photos: Photo[] }) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  if (photos.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-heading font-bold mb-4">Event Photos</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="relative aspect-square rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
          >
            <Image src={photo.image_url} alt={photo.caption || "Event photo"} fill className="object-cover" />
          </button>
        ))}
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <Image
              src={selectedPhoto.image_url}
              alt={selectedPhoto.caption || "Event photo"}
              width={1200}
              height={800}
              className="object-contain w-full h-full rounded-xl"
            />
            {selectedPhoto.caption && (
              <p className="text-white text-center mt-3">{selectedPhoto.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
