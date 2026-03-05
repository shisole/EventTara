import { cdnUrl } from "@/lib/storage";

describe("cdnUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("returns null for null input", () => {
    expect(cdnUrl(null)).toBeNull();
  });

  test("returns null for undefined input", () => {
    expect(cdnUrl()).toBeNull();
  });

  test("rewrites Supabase storage URL to /storage/ path", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    expect(cdnUrl("https://abc.supabase.co/storage/v1/object/public/covers/photo.jpg")).toBe(
      "/storage/covers/photo.jpg",
    );
  });

  test("rewrites R2 public URL matching regex to /r2/ path", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("R2_PUBLIC_URL", "");
    expect(cdnUrl("https://pub-abcdef1234567890.r2.dev/events/photo.jpg")).toBe(
      "/r2/events/photo.jpg",
    );
  });

  test("returns non-matching URL unchanged", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    expect(cdnUrl("https://images.unsplash.com/photo-123")).toBe(
      "https://images.unsplash.com/photo-123",
    );
  });

  test("returns Supabase URL unchanged when env var is not set", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("R2_PUBLIC_URL", "");
    expect(cdnUrl("https://abc.supabase.co/storage/v1/object/public/covers/photo.jpg")).toBe(
      "https://abc.supabase.co/storage/v1/object/public/covers/photo.jpg",
    );
  });
});
