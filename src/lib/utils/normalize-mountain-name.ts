/**
 * Normalize mountain name prefixes to the canonical "Mt. " form.
 * "Mt ", "Mount ", "Mt.", "mt " etc. all become "Mt. ".
 */
export function normalizeMountainName(name: string): string {
  const trimmed = name.trim().replaceAll(/\s+/g, " ");
  // Match: Mt/Mt./Mount (case-insensitive) followed by optional dot and space(s)
  return trimmed.replace(/^(mt\.?|mount)\s*/i, "Mt. ");
}

/**
 * Strip the mountain prefix entirely for fuzzy comparison.
 * "Mt. Loboc" → "loboc", "Mount Apo" → "apo"
 */
export function stripMountainPrefix(name: string): string {
  return name
    .trim()
    .replace(/^(mt\.?|mount)\s*/i, "")
    .toLowerCase()
    .trim();
}
