/**
 * EventTara - Mountains Seed Script
 *
 * Seeds the mountains table and links hiking events to mountains.
 * Requires SUPABASE_SERVICE_ROLE_KEY.
 *
 * Usage: pnpm seed:mountains
 */

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

import { loadEnvironment } from "./load-env";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
loadEnvironment(projectRoot);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const PANAY_MOUNTAINS = [
  // Panay Trilogy (Antique)
  { name: "Mt. Madja-as", province: "Antique", difficulty_level: 8, elevation_masl: 2117 },
  { name: "Mt. Nangtud", province: "Antique", difficulty_level: 8, elevation_masl: 2073 },
  { name: "Mt. Baloy", province: "Antique", difficulty_level: 9, elevation_masl: 1981 },
  // Antique
  { name: "Mt. Balabag", province: "Antique", difficulty_level: 6, elevation_masl: 1713 },
  { name: "Mt. Agbalanti", province: "Antique", difficulty_level: 6, elevation_masl: 1579 },
  // Iloilo — Igbaras group
  { name: "Mt. Opao", province: "Iloilo", difficulty_level: 6, elevation_masl: 1296 },
  { name: "Mt. Taripis", province: "Iloilo", difficulty_level: 4, elevation_masl: 1320 },
  { name: "Mt. Pulang Lupa", province: "Iloilo", difficulty_level: 3, elevation_masl: 1260 },
  { name: "Mt. Napulak", province: "Iloilo", difficulty_level: 4, elevation_masl: 1239 },
  { name: "Tambara Ridge", province: "Iloilo", difficulty_level: 2, elevation_masl: 1193 },
  { name: "Mt. Igatmon", province: "Iloilo", difficulty_level: 6, elevation_masl: 1120 },
  { name: "Bato Igmatindog", province: "Iloilo", difficulty_level: 4, elevation_masl: 1000 },
  { name: "Mt. Loboc", province: "Iloilo", difficulty_level: 4, elevation_masl: 1000 },
  // Iloilo — other
  { name: "Mt. Inaman", province: "Iloilo", difficulty_level: 5, elevation_masl: 1396 },
  { name: "Mt. Igdalig", province: "Iloilo", difficulty_level: 5, elevation_masl: 1377 },
  { name: "Mt. Lingguhob", province: "Iloilo", difficulty_level: 6, elevation_masl: 1226 },
  // Iloilo — Miag-ao Trilogy
  { name: "Mt. Kongkong", province: "Iloilo", difficulty_level: 3, elevation_masl: 1046 },
  { name: "Bato Sampaw", province: "Iloilo", difficulty_level: 2, elevation_masl: 794 },
  { name: "Mt. Panay", province: "Iloilo", difficulty_level: 3, elevation_masl: 800 },
];

/** Map of hiking event title -> mountain names to link */
const HIKING_EVENT_MOUNTAINS: Record<string, string[]> = {
  "Mt. Madja-as Summit Trek": ["Mt. Madja-as"],
  "Igbaras Mountain Day Hike": ["Mt. Napulak", "Mt. Igdalig"],
  "Mt. Napulak Sunrise Hike": ["Mt. Napulak"],
  "Mt. Baloy Ridge Traverse": ["Mt. Baloy"],
  "Igbaras-Tubungan Traverse": ["Mt. Napulak", "Mt. Inaman"],
  "Baloy Falls Adventure Hike": ["Mt. Baloy"],
  "Lambunao Waterfall Trek": ["Mt. Inaman", "Mt. Igdalig"],
  "Janiuay Highlands Day Hike": ["Mt. Inaman"],
  "Nadsadan Falls Day Hike": ["Mt. Napulak"],
  "Hamtic River Gorge Trek": ["Mt. Balabag", "Mt. Agbalanti"],
  "Sibalom Natural Park Wander": ["Mt. Agbalanti"],
  "Mt. Opao Day Hike": ["Mt. Opao"],
  "Mt. Opao Sunrise Trek": ["Mt. Opao"],
  "Mt. Opao Trail Run 8K": ["Mt. Opao"],
  "Mt. Lingguhob Summit Hike": ["Mt. Lingguhob"],
  "Mt. Lingguhob Ridge Trail": ["Mt. Lingguhob"],
  "Mt. Lingguhob Night Hike": ["Mt. Lingguhob"],
  "Mt. Lingguhob Waterfall Loop": ["Mt. Lingguhob"],
  "Mt. Lingguhob Sunrise Assault": ["Mt. Lingguhob"],
  "Mt. Lingguhob Trail Cleanup Hike": ["Mt. Lingguhob"],
  "Mt. Lingguhob Full Moon Hike": ["Mt. Lingguhob"],
  "Mt. Lingguhob Beginner Day Hike": ["Mt. Lingguhob"],
  "Mt. Igatmon Expedition": ["Mt. Igatmon"],
  "Mt. Igatmon Summit Day Hike": ["Mt. Igatmon"],
  "Mt. Igatmon Traverse": ["Mt. Igatmon"],
};

async function seedMountains() {
  console.log("Seeding mountains...\n");

  const mountainMap = new Map<string, { id: string; difficulty_level: number }>();

  for (const mountain of PANAY_MOUNTAINS) {
    const { data, error } = await supabase
      .from("mountains")
      .upsert(mountain, { onConflict: "name" })
      .select("id, name, difficulty_level")
      .single();

    if (error) {
      console.error(`  Failed: ${mountain.name} — ${error.message}`);
    } else {
      mountainMap.set(data.name, data);
      console.log(
        `  \u2713 ${mountain.name} (${mountain.elevation_masl}m, difficulty ${mountain.difficulty_level})`,
      );
    }
  }

  console.log(`\n${mountainMap.size} mountains seeded.\n`);

  // Link hiking events to mountains
  console.log("Linking hiking events to mountains...\n");

  let linked = 0;
  for (const [eventTitle, mountainNames] of Object.entries(HIKING_EVENT_MOUNTAINS)) {
    // Find event by title
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("title", eventTitle)
      .maybeSingle();

    if (!event) {
      console.warn(`  Event not found: ${eventTitle}`);
      continue;
    }

    let maxDifficulty = 0;

    for (let i = 0; i < mountainNames.length; i++) {
      const mountain = mountainMap.get(mountainNames[i]);
      if (!mountain) {
        console.warn(`  Mountain not found: ${mountainNames[i]}`);
        continue;
      }

      const { error } = await supabase
        .from("event_mountains")
        .upsert(
          { event_id: event.id, mountain_id: mountain.id, sort_order: i },
          { onConflict: "event_id,mountain_id" },
        );

      if (error) {
        console.error(`  Failed to link ${mountainNames[i]} -> ${eventTitle}: ${error.message}`);
      } else {
        console.log(`  \u2713 ${mountainNames[i]} -> ${eventTitle}`);
        linked++;
      }

      if (mountain.difficulty_level > maxDifficulty) {
        maxDifficulty = mountain.difficulty_level;
      }
    }

    if (maxDifficulty > 0) {
      await supabase.from("events").update({ difficulty_level: maxDifficulty }).eq("id", event.id);
    }
  }

  console.log(`\n${linked} event-mountain links created.`);
  console.log("\nDone!");
}

seedMountains().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
