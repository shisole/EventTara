"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, TrashIcon } from "@/components/icons";
import { UserAvatar } from "@/components/ui";
import { uploadImage } from "@/lib/upload";
import { formatRelativeTime } from "@/lib/utils/relative-time";

interface PhotoItem {
  id: string;
  event_id: string;
  user_id: string | null;
  image_url: string;
  raw_image_url: string;
  caption: string | null;
  uploaded_at: string;
  userName: string;
  userUsername: string | null;
  userAvatarUrl: string | null;
}

interface EventPhotosClientProps {
  eventId: string;
  initialPhotos: PhotoItem[];
  canUpload: boolean;
  isClubAdmin: boolean;
  currentUserId: string | null;
}

export default function EventPhotosClient({
  eventId,
  initialPhotos,
  canUpload,
  isClubAdmin,
  currentUserId,
}: EventPhotosClientProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      setUploadError(null);

      try {
        const fileArray = [...files];

        for (const file of fileArray) {
          // Upload to R2
          const imageUrl = await uploadImage(file, "events/photos");

          // Save to database
          const res = await fetch(`/api/events/${eventId}/photos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_url: imageUrl }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to save photo");
          }

          const { photo } = await res.json();

          setPhotos((prev) => [
            {
              id: photo.id,
              event_id: photo.event_id,
              user_id: photo.user_id,
              image_url: imageUrl,
              raw_image_url: imageUrl,
              caption: photo.caption,
              uploaded_at: photo.uploaded_at,
              userName: "You",
              userUsername: null,
              userAvatarUrl: null,
            },
            ...prev,
          ]);
        }
      } catch (error) {
        console.error("[EventPhotos] Upload error:", error);
        setUploadError(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [eventId],
  );

  const handleDelete = useCallback(
    async (photoId: string) => {
      if (!confirm("Delete this photo?")) return;
      setDeleting(photoId);

      try {
        const res = await fetch(`/api/events/${eventId}/photos?photoId=${photoId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to delete photo");
        }

        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        if (selectedIndex !== null) {
          setSelectedIndex(null);
        }
      } catch (error) {
        console.error("[EventPhotos] Delete error:", error);
        alert(error instanceof Error ? error.message : "Delete failed");
      } finally {
        setDeleting(null);
      }
    },
    [eventId, selectedIndex],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      void handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect],
  );

  const canDeletePhoto = (photo: PhotoItem) => photo.user_id === currentUserId || isClubAdmin;

  const selectedPhoto = selectedIndex === null ? null : photos[selectedIndex];

  return (
    <div>
      {/* Upload section */}
      {canUpload && (
        <div
          className="mb-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 text-center hover:border-lime-400 dark:hover:border-lime-500 transition-colors"
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={handleDrop}
        >
          <div className="space-y-3">
            <div className="text-4xl">📷</div>
            <p className="text-gray-600 dark:text-gray-400">
              Drag and drop photos here, or{" "}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-lime-600 dark:text-lime-400 font-medium hover:underline"
                disabled={uploading}
              >
                browse
              </button>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Max 2 MB per photo. JPG, PNG, WebP.
            </p>
            {uploading && (
              <p className="text-sm text-lime-600 dark:text-lime-400 font-medium animate-pulse">
                Uploading...
              </p>
            )}
            {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void handleFileSelect(e.target.files)}
          />
        </div>
      )}

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <div className="text-5xl mb-3">📸</div>
          <p className="font-medium">No photos yet</p>
          {canUpload && (
            <p className="text-sm mt-1">Be the first to share a photo from this event!</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="group relative">
              <button
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-90 transition-opacity"
              >
                <Image
                  src={photo.image_url}
                  alt={photo.caption || "Event photo"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
              </button>

              {/* Photographer info */}
              <div className="flex items-center gap-2 mt-2">
                <UserAvatar src={photo.userAvatarUrl} alt={photo.userName} size="sm" />
                <div className="flex-1 min-w-0">
                  {photo.userUsername ? (
                    <Link
                      href={`/profile/${photo.userUsername}`}
                      className="text-xs font-medium text-gray-700 dark:text-gray-300 hover:underline truncate block"
                    >
                      {photo.userName}
                    </Link>
                  ) : (
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate block">
                      {photo.userName}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {formatRelativeTime(photo.uploaded_at)}
                  </span>
                </div>
                {canDeletePhoto(photo) && (
                  <button
                    type="button"
                    onClick={() => void handleDelete(photo.id)}
                    disabled={deleting === photo.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500"
                    aria-label="Delete photo"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
              {photo.caption && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {photo.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedIndex(null)}
        >
          {selectedIndex !== null && selectedIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(selectedIndex - 1);
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
          )}

          {selectedIndex !== null && selectedIndex < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(selectedIndex + 1);
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
              aria-label="Next photo"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          )}

          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-4 right-4 z-10 w-11 h-11 flex items-center justify-center bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-6 h-6" />
          </button>

          {canDeletePhoto(selectedPhoto) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                void handleDelete(selectedPhoto.id);
              }}
              disabled={deleting === selectedPhoto.id}
              className="absolute top-4 left-4 z-10 w-11 h-11 flex items-center justify-center bg-white/20 hover:bg-red-500/60 rounded-full text-white transition-colors"
              aria-label="Delete photo"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}

          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedPhoto.image_url}
              alt={selectedPhoto.caption || "Event photo"}
              width={1200}
              height={800}
              className="object-contain w-full h-full rounded-xl"
            />
            <div className="text-center mt-3 space-y-1">
              <div className="flex items-center justify-center gap-2">
                <UserAvatar
                  src={selectedPhoto.userAvatarUrl}
                  alt={selectedPhoto.userName}
                  size="sm"
                />
                <span className="text-white text-sm font-medium">{selectedPhoto.userName}</span>
                <span className="text-white/50 text-xs">
                  {formatRelativeTime(selectedPhoto.uploaded_at)}
                </span>
              </div>
              {selectedPhoto.caption && (
                <p className="text-white/80 text-sm">{selectedPhoto.caption}</p>
              )}
              <p className="text-white/40 text-xs">
                {(selectedIndex ?? 0) + 1} / {photos.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
