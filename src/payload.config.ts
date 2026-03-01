import path from "node:path";
import { fileURLToPath } from "node:url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Media } from "./payload/collections/media";
import { Pages } from "./payload/collections/pages";
import { FeatureFlags } from "./payload/globals/feature-flags";
import { HeroCarousel } from "./payload/globals/hero-carousel";
import { Navigation } from "./payload/globals/navigation";
import { SiteSettings } from "./payload/globals/site-settings";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: "payload-admins",
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: "payload-admins",
      auth: true,
      admin: {
        useAsTitle: "email",
      },
      fields: [],
    },
    Pages,
    Media,
  ],
  globals: [FeatureFlags, HeroCarousel, Navigation, SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "CHANGE-ME-IN-PRODUCTION",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
    schemaName: "payload",
  }),
  sharp,
  plugins: [],
});
