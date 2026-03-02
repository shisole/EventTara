export async function uploadImage(file: File, folder: string): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  body.append("folder", folder);

  const res = await fetch("/api/upload", { method: "POST", body });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Upload failed");
  }

  return data.url as string;
}
