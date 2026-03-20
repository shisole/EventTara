/**
 * Shared media utilities — video detection and image compression.
 * Used by EventGallery, EventPhotoManager, PhotoUploader, etc.
 */

export const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "ogg"]);

const MAX_IMAGE_BYTES = 1 * 1024 * 1024; // 1 MB
const MAX_DIMENSION = 2000;

/** Check if a URL points to a video file based on extension. */
export function isVideo(url: string): boolean {
  const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "";
  return VIDEO_EXTENSIONS.has(ext);
}

/** Check if a File object is a video based on MIME type. */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/");
}

/**
 * Compress an image file: resize to max 2000px on longest side,
 * then try decreasing JPEG quality until under 1 MB.
 */
export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new globalThis.Image();
    img.addEventListener("load", () => {
      let { width, height } = img;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      const qualities = [0.85, 0.75, 0.65, 0.5, 0.4];
      for (const quality of qualities) {
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const base64 = dataUrl.split(",")[1];
        const bytes = Math.ceil((base64.length * 3) / 4);
        if (bytes <= MAX_IMAGE_BYTES || quality === qualities.at(-1)) {
          const byteString = atob(base64);
          const byteArray = new Uint8Array(byteString.length);
          for (let i = 0; i < byteString.length; i++) {
            byteArray[i] = byteString.codePointAt(i)!;
          }
          const blob = new Blob([byteArray], { type: "image/jpeg" });
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
          return;
        }
      }
    });
    img.addEventListener("error", () => {
      reject(new Error("Failed to load image"));
    });
    img.src = URL.createObjectURL(file);
  });
}
