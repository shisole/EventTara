/**
 * EventTara - CMS Pages Seed Script
 *
 * Seeds the Payload CMS with initial pages (Privacy Policy, Data Deletion)
 * and the Navigation global (footer sections).
 *
 * Requires the dev server to be running on PAYLOAD_API_URL (default: http://localhost:3000).
 * If no admin user exists, the script will create one via first-register.
 *
 * Usage: npm run seed:cms
 */

const PAYLOAD_API_URL = process.env.PAYLOAD_API_URL || 'http://localhost:3000'
const ADMIN_EMAIL = process.env.PAYLOAD_ADMIN_EMAIL || 'admin@eventtara.com'
const ADMIN_PASSWORD = process.env.PAYLOAD_ADMIN_PASSWORD || 'admin123456'

async function getAuthToken(): Promise<string> {
  // Try to login first
  const loginRes = await fetch(`${PAYLOAD_API_URL}/api/payload-admins/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })

  if (loginRes.ok) {
    const data = await loginRes.json()
    return data.token
  }

  // If login fails, try first-register (only works when no admin exists)
  const registerRes = await fetch(`${PAYLOAD_API_URL}/api/payload-admins/first-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })

  if (registerRes.ok) {
    const data = await registerRes.json()
    console.log('Created admin user for seeding.')
    return data.token
  }

  throw new Error(
    `Failed to authenticate. Login: ${loginRes.status}, Register: ${registerRes.status}`
  )
}

async function seedCMSPages() {
  console.log(`Using Payload API at: ${PAYLOAD_API_URL}`)

  const token = await getAuthToken()
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `JWT ${token}`,
  }

  // Check if pages already exist
  const existingRes = await fetch(`${PAYLOAD_API_URL}/api/pages?limit=100`)
  if (!existingRes.ok) {
    throw new Error(
      `Failed to check existing pages: ${existingRes.status} ${existingRes.statusText}`
    )
  }
  const existing = await existingRes.json()
  if (existing.docs.length > 0) {
    console.log(`Pages already exist (${existing.docs.length} found), skipping seed.`)
    process.exit(0)
  }

  // Privacy Policy
  const privacyRes = await fetch(`${PAYLOAD_API_URL}/api/pages`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Privacy Policy',
      slug: 'privacy-policy',
      description:
        'Learn how EventTara collects, uses, and protects your personal information.',
      status: 'published',
      lastUpdatedLabel: '2026-02-20T00:00:00.000Z',
    }),
  })
  if (!privacyRes.ok) {
    const err = await privacyRes.text()
    throw new Error(`Failed to create Privacy Policy: ${privacyRes.status} ${err}`)
  }
  console.log('Created: Privacy Policy')

  // Data Deletion
  const deletionRes = await fetch(`${PAYLOAD_API_URL}/api/pages`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Data Deletion Instructions',
      slug: 'data-deletion',
      description:
        'Learn how to request deletion of your personal data from EventTara.',
      status: 'published',
      lastUpdatedLabel: '2026-02-20T00:00:00.000Z',
    }),
  })
  if (!deletionRes.ok) {
    const err = await deletionRes.text()
    throw new Error(`Failed to create Data Deletion: ${deletionRes.status} ${err}`)
  }
  console.log('Created: Data Deletion Instructions')

  // Seed navigation footer via globals API
  const navRes = await fetch(`${PAYLOAD_API_URL}/api/globals/navigation`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      footer: {
        tagline: 'Tara na! — Your adventure starts here.',
        sections: [
          {
            title: 'Explore',
            links: [
              { label: 'Browse Events', url: '/events' },
              { label: 'Hiking', url: '/events?type=hiking' },
              { label: 'Mountain Biking', url: '/events?type=mtb' },
              { label: 'Running', url: '/events?type=running' },
            ],
          },
          {
            title: 'For Organizers',
            links: [
              { label: 'Host Your Event', url: '/signup?role=organizer' },
              { label: 'Organizer Dashboard', url: '/dashboard' },
            ],
          },
        ],
        legalLinks: [
          { label: 'Privacy Policy', url: '/privacy-policy' },
          { label: 'Data Deletion', url: '/data-deletion' },
        ],
      },
    }),
  })
  if (!navRes.ok) {
    const err = await navRes.text()
    throw new Error(`Failed to seed Navigation global: ${navRes.status} ${err}`)
  }
  console.log('Seeded: Navigation global')

  console.log('\nDone! Pages have been created without rich text content.')
  console.log(
    'Go to /admin to edit the pages and add their content using the rich text editor.'
  )
  process.exit(0)
}

seedCMSPages().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
