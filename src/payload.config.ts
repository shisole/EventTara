import { postgresAdapter } from '@payloadcms/db-postgres'
import { Media } from './payload/collections/media'
import { Pages } from './payload/collections/pages'
import { Navigation } from './payload/globals/navigation'
import { SiteSettings } from './payload/globals/site-settings'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: 'payload-admins',
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: 'payload-admins',
      auth: true,
      admin: {
        useAsTitle: 'email',
      },
      fields: [],
    },
    Pages,
    Media,
  ],
  globals: [SiteSettings, Navigation],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'CHANGE-ME-IN-PRODUCTION',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    schemaName: 'payload',
  }),
  sharp,
  plugins: [],
})
