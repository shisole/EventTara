export function resolvePresetImage(
  imageUrl: string | null,
): { type: "url"; url: string } | { type: "emoji"; emoji: string; color: string } | null {
  if (!imageUrl) return null;
  if (!imageUrl.startsWith("preset:")) return { type: "url", url: imageUrl };
  const presetId = imageUrl.replace("preset:", "");
  const preset = PRESET_AVATARS.find((a) => a.id === presetId);
  if (!preset) return null;
  return { type: "emoji", emoji: preset.emoji, color: preset.color };
}

export const PRESET_AVATARS = [
  { id: "mountain-goat", label: "Mountain Goat", emoji: "\u{1F410}", color: "bg-amber-100" },
  { id: "eagle", label: "Eagle", emoji: "\u{1F985}", color: "bg-blue-100" },
  { id: "biker", label: "Biker", emoji: "\u{1F6B4}", color: "bg-teal-100" },
  { id: "runner", label: "Runner", emoji: "\u{1F3C3}", color: "bg-green-100" },
  { id: "hiker", label: "Hiker", emoji: "\u{1F97E}", color: "bg-forest-100" },
  { id: "climber", label: "Climber", emoji: "\u{1F9D7}", color: "bg-purple-100" },
  { id: "wolf", label: "Wolf", emoji: "\u{1F43A}", color: "bg-gray-100" },
  { id: "dolphin", label: "Dolphin", emoji: "\u{1F42C}", color: "bg-cyan-100" },
  { id: "phoenix", label: "Phoenix", emoji: "\u{1F525}", color: "bg-red-100" },
  { id: "turtle", label: "Turtle", emoji: "\u{1F422}", color: "bg-emerald-100" },
  { id: "bear", label: "Bear", emoji: "\u{1F43B}", color: "bg-yellow-100" },
  { id: "hawk", label: "Hawk", emoji: "\u{1F985}", color: "bg-indigo-100" },
];
