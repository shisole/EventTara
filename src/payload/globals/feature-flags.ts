import type { GlobalConfig } from "payload";

export const FeatureFlags: GlobalConfig = {
  slug: "feature-flags",
  label: "Feature Flags",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "activityFeed",
      type: "checkbox",
      defaultValue: false,
      label: "Activity Feed",
      admin: {
        description:
          "When enabled, the /feed and /post pages are accessible. When disabled, these pages show a coming-soon message.",
      },
    },
  ],
};
