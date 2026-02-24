import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
  },
  upload: {
    mimeTypes: ["image/*"],
    staticDir: "public/media",
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      admin: {
        description: "Alt text for accessibility.",
      },
    },
  ],
};
