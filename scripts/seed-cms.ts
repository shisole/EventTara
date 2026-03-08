/**
 * EventTara - CMS Seed Script
 *
 * Seeds all 5 CMS tables in Supabase with default data.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
 *
 * Usage: pnpm seed:cms
 */

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

import { loadEnvironment } from "./load-env";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
loadEnvironment(projectRoot);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function seedCMS() {
  console.log("Seeding CMS tables...\n");

  // 1. Site Settings
  const { error: settingsErr } = await supabase.from("cms_site_settings").upsert(
    {
      id: 1,
      site_name: "EventTara",
      tagline: "Tara na! Book Your Next Adventure",
      site_description:
        "EventTara is an adventure event booking platform for hiking, mountain biking, road biking, running, and more. Tara na!",
      site_url: "https://eventtara.com",
      contact_email: "privacy@eventtara.com",
      copyright_text: "\u00a9 {year} EventTara. All rights reserved.",
      nav_layout: "strip",
      parallax_image_url: null,
      seo_title_template: "%s \u2014 EventTara",
      seo_keywords:
        "events, adventure, hiking, mountain biking, road biking, running, trail running, Philippines, outdoor, booking",
      seo_og_locale: "en_PH",
    },
    { onConflict: "id" },
  );
  if (settingsErr) throw new Error(`Site settings: ${settingsErr.message}`);
  console.log("  \u2713 cms_site_settings");

  // 2. Navigation
  const { error: navErr } = await supabase.from("cms_navigation").upsert(
    {
      id: 1,
      header_links: [],
      footer_tagline: "Tara na! \u2014 Your adventure starts here.",
      footer_sections: [
        {
          title: "Explore",
          links: [
            { label: "Browse Events", url: "/events" },
            { label: "Hiking", url: "/events?type=hiking" },
            { label: "Mountain Biking", url: "/events?type=mtb" },
            { label: "Running", url: "/events?type=running" },
          ],
        },
        {
          title: "For Organizers",
          links: [
            { label: "Host Your Event", url: "/signup?role=organizer" },
            { label: "Organizer Dashboard", url: "/dashboard" },
          ],
        },
      ],
      footer_legal_links: [
        { label: "Privacy Policy", url: "/privacy-policy" },
        { label: "Data Deletion", url: "/data-deletion" },
      ],
    },
    { onConflict: "id" },
  );
  if (navErr) throw new Error(`Navigation: ${navErr.message}`);
  console.log("  \u2713 cms_navigation");

  // 3. Hero Carousel
  const { error: heroErr } = await supabase.from("cms_hero_carousel").upsert(
    {
      id: 1,
      slides: [
        { url: "/media/hiking.jpg", alt: "Hikers on a mountain trail at sunrise" },
        { url: "/media/mountain-biking.jpg", alt: "Mountain biker on a forest trail" },
        { url: "/media/trail-running.jpg", alt: "Trail runners in the hills" },
      ],
    },
    { onConflict: "id" },
  );
  if (heroErr) throw new Error(`Hero carousel: ${heroErr.message}`);
  console.log("  \u2713 cms_hero_carousel");

  // 4. Feature Flags
  const { error: flagsErr } = await supabase.from("cms_feature_flags").upsert(
    {
      id: 1,
      activity_feed: true,
      strava_showcase_features: true,
      strava_showcase_stats: true,
      strava_showcase_route_map: true,
      club_reviews: true,
      events_two_col_mobile: true,
      coming_soon_strava: false,
      coming_soon_gamification: true,
      coming_soon_bento: false,
      ewallet_payments: false,
      oauth_google: true,
      oauth_strava: true,
      oauth_facebook: true,
    },
    { onConflict: "id" },
  );
  if (flagsErr) throw new Error(`Feature flags: ${flagsErr.message}`);
  console.log("  \u2713 cms_feature_flags");

  // 5. CMS Pages
  const pages = [
    {
      title: "Privacy Policy",
      slug: "privacy-policy",
      description: "Learn how EventTara collects, uses, and protects your personal information.",
      status: "published" as const,
      last_updated_label: "2026-02-27",
      content_html: `
<h3>1. Introduction</h3>
<p>EventTara ("we," "us," or "our") is a Philippine outdoor adventure event booking platform for hiking, mountain biking, road biking, running, and trail running. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.</p>

<h3>2. Information We Collect</h3>
<p>We may collect the following types of information:</p>
<ul>
<li><strong>Account information:</strong> When you sign up or log in using Facebook or other providers, we receive your name, email address, and profile photo.</li>
<li><strong>Profile data:</strong> Information you provide to complete your profile, such as your username and contact details.</li>
<li><strong>Booking and event activity:</strong> Records of events you book, attend, or organize, including check-in data.</li>
<li><strong>Payment information:</strong> Payment method selected (GCash, Maya, or cash) and payment proof screenshots uploaded for verification. We do not store credit card numbers or e-wallet credentials.</li>
<li><strong>QR codes:</strong> Unique QR codes generated for event check-in purposes.</li>
<li><strong>Companion data:</strong> Names and optional phone numbers of companions you register for events.</li>
<li><strong>Badge awards:</strong> Badges earned through event participation and achievements.</li>
<li><strong>Device and usage data:</strong> Browser type, IP address, and pages visited, collected automatically through standard web server logs.</li>
</ul>

<h3>3. How We Use Your Information</h3>
<ul>
<li><strong>Account creation and authentication:</strong> To create and manage your account, including login via Facebook OAuth.</li>
<li><strong>Event booking and management:</strong> To process your event registrations and provide booking confirmations.</li>
<li><strong>Communication:</strong> To send transactional emails such as booking confirmations, event updates, and badge award notifications.</li>
<li><strong>Badge system:</strong> To track and award badges based on your event participation.</li>
<li><strong>Service improvement:</strong> To understand how our platform is used and improve the user experience.</li>
</ul>

<h3>4. Third-Party Services</h3>
<p>We use the following third-party services to operate our platform:</p>
<ul>
<li><strong>Supabase:</strong> For authentication, database storage, and file storage. Your account data and event information are stored securely on Supabase infrastructure.</li>
<li><strong>Resend:</strong> For sending transactional emails such as booking confirmations and badge award notifications.</li>
<li><strong>Facebook Login:</strong> If you choose to log in with Facebook, we receive the profile information you authorize. We do not post to your Facebook account or access your friends list.</li>
<li><strong>Google Analytics:</strong> For aggregated, anonymized usage analytics to understand how the platform is used. No personally identifiable information is shared with Google.</li>
<li><strong>Vercel:</strong> Our website is hosted on Vercel's infrastructure. Vercel may process server logs containing IP addresses.</li>
</ul>

<h3>5. Data Security</h3>
<p>We implement appropriate technical and organizational measures to protect your personal information, including:</p>
<ul>
<li>Encrypted connections (HTTPS/TLS) for all data in transit.</li>
<li>Row-level security policies on our database to ensure users can only access their own data.</li>
<li>Authentication tokens stored in secure, HTTP-only cookies.</li>
<li>Payment proof images stored in access-controlled cloud storage.</li>
</ul>

<h3>6. Data Sharing</h3>
<p>We do not sell, rent, or trade your personal information. Your information may be shared only in the following circumstances:</p>
<ul>
<li><strong>Event organizers:</strong> When you book an event, the organizer receives your name and contact information necessary to manage the event.</li>
<li><strong>Legal requirements:</strong> We may disclose information if required by law or in response to valid legal process.</li>
</ul>

<h3>7. Cookies and Session Data</h3>
<p>We use authentication session cookies managed by Supabase to keep you logged in securely. These cookies are essential for the functioning of the service and are not used for advertising or tracking purposes.</p>

<h3>8. Data Retention and Deletion</h3>
<p>We retain your personal information for as long as your account is active or as needed to provide our services. If you wish to request deletion of your account and associated data, please contact us at info@eventtara.com. We will process your request within 30 days. For details on how to delete your data, including data associated with Facebook Login, please visit our <a href="/data-deletion">data deletion</a> page.</p>

<h3>9. Philippine Data Privacy Act</h3>
<p>EventTara complies with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173). As a data controller, we ensure that your personal information is collected for specified and legitimate purposes, processed fairly and lawfully, and protected against unauthorized access. You have the right to access, correct, and request deletion of your personal data. To exercise these rights, contact us at info@eventtara.com.</p>

<h3>10. Children's Privacy</h3>
<p>Our service is not directed at individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected data from a child under 13, we will take steps to delete that information promptly.</p>

<h3>11. Changes to This Policy</h3>
<p>We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. We encourage you to review this policy periodically to stay informed about how we protect your information.</p>

<h3>12. Contact Us</h3>
<p>If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at info@eventtara.com.</p>
      `.trim(),
    },
    {
      title: "Data Deletion Instructions",
      slug: "data-deletion",
      description: "Learn how to request deletion of your personal data from EventTara.",
      status: "published" as const,
      last_updated_label: "2026-02-27",
      content_html: `
<p>If you signed up for EventTara using your Facebook account and would like to delete your data, you can follow any of the options below.</p>

<h3>Option 1: Delete Your Account from EventTara</h3>
<ol>
<li>Log in to your EventTara account.</li>
<li>Go to your Profile page.</li>
<li>Navigate to Settings.</li>
<li>Click "Delete Account" and confirm.</li>
<li>All your personal data will be permanently removed.</li>
</ol>

<h3>Option 2: Request Deletion via Email</h3>
<p>Send an email to <strong>info@eventtara.com</strong> with the subject line "Data Deletion Request". Include the email address associated with your Facebook account. We will process your request within 30 days.</p>

<h3>Option 3: Remove EventTara from Facebook</h3>
<ol>
<li>Go to your Facebook Settings &gt; Apps and Websites.</li>
<li>Find EventTara in the list of apps.</li>
<li>Click "Remove" and select the option to delete all data associated with EventTara.</li>
</ol>

<h3>What Data We Delete</h3>
<p>When you request account deletion, we permanently remove:</p>
<ul>
<li>Your profile information (name, email, avatar)</li>
<li>Booking history and QR codes</li>
<li>Event check-in records</li>
<li>Reviews and ratings</li>
<li>Badges earned</li>
<li>Any uploaded payment proof images</li>
</ul>
<p>Anonymized, aggregated data (such as event attendance counts) may be retained for analytics purposes but cannot be linked back to you.</p>

<h3>Contact</h3>
<p>If you have any questions about data deletion, contact us at <strong>info@eventtara.com</strong>.</p>
      `.trim(),
    },
  ];

  for (const page of pages) {
    const { error: pageErr } = await supabase
      .from("cms_pages")
      .upsert(page, { onConflict: "slug" });
    if (pageErr) throw new Error(`Page "${page.slug}": ${pageErr.message}`);
    console.log(`  \u2713 cms_pages: ${page.slug}`);
  }

  console.log("\nDone! All CMS tables seeded.");
}

seedCMS().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
