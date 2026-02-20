import type { GlobalConfig } from 'payload'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Navigation',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'header',
      type: 'group',
      fields: [
        {
          name: 'links',
          type: 'array',
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
            },
            {
              name: 'url',
              type: 'text',
              required: true,
            },
            {
              name: 'requiresAuth',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Only show this link to logged-in users.',
              },
            },
            {
              name: 'roles',
              type: 'select',
              hasMany: true,
              options: [
                { label: 'Participant', value: 'participant' },
                { label: 'Organizer', value: 'organizer' },
                { label: 'Guest', value: 'guest' },
              ],
              admin: {
                description: 'Show only to these roles. Leave empty for all roles.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'footer',
      type: 'group',
      fields: [
        {
          name: 'tagline',
          type: 'text',
          defaultValue: 'Tara na! — Your adventure starts here.',
        },
        {
          name: 'sections',
          type: 'array',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'links',
              type: 'array',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          name: 'legalLinks',
          type: 'array',
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
            },
            {
              name: 'url',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
