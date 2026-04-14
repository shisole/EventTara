/**
 * Strips HTML tags and trims a plain-text name field.
 * Lightweight alternative to sanitize-html for simple text inputs.
 */
export function sanitizeName(value: string): string {
  return value
    .replaceAll(/<[^>]*>/g, "")
    .replaceAll(/[<>]/g, "")
    .trim();
}
