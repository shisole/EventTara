import type { GlobalConfig } from "payload";

export const FeatureFlags: GlobalConfig = {
  slug: "feature-flags",
  label: "Feature Flags",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "badgeShowcase",
      type: "checkbox",
      defaultValue: false,
      label: "Badge Showcase",
      admin: {
        description:
          "When enabled, badge activities in the feed display a visual showcase with the badge image, rarity ring, and category pill. When disabled, badge activities show plain text only.",
      },
    },
  ],
};
