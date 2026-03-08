/** Escape a CSV value: wrap in double quotes and double any internal quotes. */
function escapeValue(value: string): string {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
}

/**
 * Downloads a CSV file with the given headers and rows.
 * Handles value escaping and adds BOM for Excel compatibility.
 */
export function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csvLines: string[] = [];

  // Header row
  csvLines.push(headers.map((h) => escapeValue(h)).join(","));

  // Data rows
  for (const row of rows) {
    csvLines.push(row.map((v) => escapeValue(v)).join(","));
  }

  const csvContent = csvLines.join("\n");

  // Add BOM (Byte Order Mark) for Excel compatibility with UTF-8
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

  // Create download link, click, and cleanup
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
