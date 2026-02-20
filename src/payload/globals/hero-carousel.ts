import type { GlobalConfig } from 'payload'

export const HeroCarousel: GlobalConfig = {
  slug: 'hero-carousel',
  label: 'Hero Carousel',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'slides',
      type: 'array',
      label: 'Slides',
      minRows: 0,
      maxRows: 10,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
  ],
}
