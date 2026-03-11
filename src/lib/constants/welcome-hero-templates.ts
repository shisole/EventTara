const UNSPLASH_PARAMS = "?w=1200&q=80&fit=crop";

export interface WelcomeHeroTemplate {
  url: string;
  label: string;
}

export const WELCOME_HERO_TEMPLATES: WelcomeHeroTemplate[] = [
  {
    url: `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b${UNSPLASH_PARAMS}`,
    label: "Mountains",
  },
  {
    url: `https://images.unsplash.com/photo-1551632811-561732d1e306${UNSPLASH_PARAMS}`,
    label: "Hiking Trail",
  },
  {
    url: `https://images.unsplash.com/photo-1544191696-102dbdaeeaa0${UNSPLASH_PARAMS}`,
    label: "Forest Ride",
  },
  {
    url: `https://images.unsplash.com/photo-1541625602330-2277a4c46182${UNSPLASH_PARAMS}`,
    label: "Road Cycling",
  },
  {
    url: `https://images.unsplash.com/photo-1452626038306-9aae5e071dd3${UNSPLASH_PARAMS}`,
    label: "Marathon",
  },
  {
    url: `https://images.unsplash.com/photo-1483721310020-03333e577078${UNSPLASH_PARAMS}`,
    label: "Trail Run",
  },
  {
    url: `https://images.unsplash.com/photo-1506905925346-21bda4d32df4${UNSPLASH_PARAMS}`,
    label: "Summit",
  },
  {
    url: `https://images.unsplash.com/photo-1530549387789-4c1017266635${UNSPLASH_PARAMS}`,
    label: "Group Activity",
  },
];
