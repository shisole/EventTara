import { type Database } from "@/lib/supabase/types";

type EventType = Database["public"]["Tables"]["events"]["Row"]["type"];

export interface CoverTemplate {
  url: string;
  label: string;
  activityType: EventType;
}

const UNSPLASH_PARAMS = "?w=1200&q=80&fit=crop";

export const COVER_TEMPLATES: CoverTemplate[] = [
  // Hiking
  {
    url: `https://images.unsplash.com/photo-1551632811-561732d1e306${UNSPLASH_PARAMS}`,
    label: "Mountain Trail",
    activityType: "hiking",
  },
  {
    url: `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b${UNSPLASH_PARAMS}`,
    label: "Summit View",
    activityType: "hiking",
  },
  // MTB
  {
    url: `https://images.unsplash.com/photo-1544191696-102dbdaeeaa0${UNSPLASH_PARAMS}`,
    label: "Forest Ride",
    activityType: "mtb",
  },
  {
    url: `https://images.unsplash.com/photo-1576858574144-9ae1ebcf5ae5${UNSPLASH_PARAMS}`,
    label: "Dirt Trail",
    activityType: "mtb",
  },
  // Road Bike
  {
    url: `https://images.unsplash.com/photo-1541625602330-2277a4c46182${UNSPLASH_PARAMS}`,
    label: "Scenic Road",
    activityType: "road_bike",
  },
  {
    url: `https://images.unsplash.com/photo-1517649763962-0c623066013b${UNSPLASH_PARAMS}`,
    label: "Peloton",
    activityType: "road_bike",
  },
  // Running
  {
    url: `https://images.unsplash.com/photo-1452626038306-9aae5e071dd3${UNSPLASH_PARAMS}`,
    label: "Marathon",
    activityType: "running",
  },
  {
    url: `https://images.unsplash.com/photo-1486218119243-13883505764c${UNSPLASH_PARAMS}`,
    label: "Road Run",
    activityType: "running",
  },
  // Trail Running
  {
    url: `https://images.unsplash.com/photo-1483721310020-03333e577078${UNSPLASH_PARAMS}`,
    label: "Forest Trail",
    activityType: "trail_run",
  },
  {
    url: `https://images.unsplash.com/photo-1502904550040-7534597429ae${UNSPLASH_PARAMS}`,
    label: "Mountain Path",
    activityType: "trail_run",
  },
];
