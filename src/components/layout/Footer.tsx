import Link from "next/link";
import { getPayloadClient } from "@/lib/payload/client";

export default async function Footer() {
  let navigation;
  try {
    const payload = await getPayloadClient();
    navigation = await payload.findGlobal({ slug: 'navigation' });
  } catch {
    navigation = null;
  }

  const footerTagline = navigation?.footer?.tagline || "Tara na! — Your adventure starts here.";
  const sections = navigation?.footer?.sections || [];
  const legalLinks = navigation?.footer?.legalLinks || [];

  // Fallback sections if CMS has no content yet
  const defaultSections = [
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
        { label: "Host Your Event", url: "/signup" },
        { label: "Organizer Dashboard", url: "/dashboard" },
      ],
    },
  ];

  const defaultLegalLinks = [
    { label: "Privacy Policy", url: "/privacy-policy" },
    { label: "Data Deletion", url: "/data-deletion" },
  ];

  const displaySections = sections.length > 0 ? sections : defaultSections;
  const displayLegalLinks = legalLinks.length > 0 ? legalLinks : defaultLegalLinks;

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-gray-900 dark:text-white font-heading font-bold text-xl mb-3">
              EventTara
            </h3>
            <p className="text-sm">{footerTagline}</p>
          </div>
          {displaySections.map((section: { title: string; links: { label: string; url: string; id?: string }[]; id?: string }, i: number) => (
            <div key={section.id || i}>
              <h4 className="text-gray-900 dark:text-white font-medium mb-3">
                {section.title}
              </h4>
              <div className="space-y-2 text-sm">
                {section.links?.map((link: { label: string; url: string; id?: string }, j: number) => (
                  <Link
                    key={link.id || j}
                    href={link.url}
                    className="block hover:text-gray-900 dark:hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-sm text-center flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <span>&copy; {new Date().getFullYear()} EventTara. All rights reserved.</span>
          {displayLegalLinks.map((link: { label: string; url: string; id?: string }, i: number) => (
            <Link
              key={link.id || i}
              href={link.url}
              className="hover:text-gray-900 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
