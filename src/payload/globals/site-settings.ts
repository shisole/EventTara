import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: 'EventTara',
    },
    {
      name: 'tagline',
      type: 'text',
      required: true,
      defaultValue: 'Tara na! Book Your Next Adventure',
    },
    {
      name: 'siteDescription',
      type: 'textarea',
      required: true,
      defaultValue:
        'EventTara is an adventure event booking platform for hiking, mountain biking, road biking, running, and more. Tara na!',
    },
    {
      name: 'siteUrl',
      type: 'text',
      defaultValue: 'https://eventtara.com',
    },
    {
      name: 'contactEmail',
      type: 'email',
      defaultValue: 'privacy@eventtara.com',
    },
    {
      name: 'copyrightText',
      type: 'text',
      defaultValue: '© {year} EventTara. All rights reserved.',
      admin: {
        description: 'Use {year} as a placeholder for the current year.',
      },
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'titleTemplate',
          type: 'text',
          defaultValue: '%s — EventTara',
          admin: {
            description: 'Use %s as a placeholder for the page title.',
          },
        },
        {
          name: 'keywords',
          type: 'text',
          defaultValue:
            'events, adventure, hiking, mountain biking, road biking, running, trail running, Philippines, outdoor, booking',
          admin: {
            description: 'Comma-separated keywords for SEO.',
          },
        },
        {
          name: 'ogLocale',
          type: 'text',
          defaultValue: 'en_PH',
        },
      ],
    },
  ],
}
