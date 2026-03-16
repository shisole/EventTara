import Link from "next/link";

import { getCachedNavigation, parseFooterLegalLinks, parseFooterSections } from "@/lib/cms/cached";

export default async function Footer() {
  const navigation = await getCachedNavigation();

  const footerTagline =
    navigation?.footer_tagline || "Started in Iloilo, built for adventurers nationwide 🇵🇭";
  const sections = parseFooterSections(navigation);
  const legalLinks = parseFooterLegalLinks(navigation);

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
      title: "For Clubs",
      links: [
        { label: "Start a Club", url: "/clubs/new" },
        { label: "Browse Clubs", url: "/clubs" },
        { label: "Club Dashboard", url: "/dashboard" },
        { label: "Contact Us", url: "/contact" },
      ],
    },
    {
      title: "About",
      links: [
        { label: "Our Story", url: "/about" },
        { label: "Contact", url: "/contact" },
      ],
    },
  ];

  const defaultLegalLinks = [
    { label: "Privacy Policy", url: "/privacy-policy" },
    { label: "Data Deletion", url: "/data-deletion" },
  ];

  // If CMS provides sections but none titled "About", append the default About section
  const hasAboutSection = sections.some((s) => s.title.toLowerCase() === "about");
  const displaySections =
    sections.length > 0
      ? hasAboutSection
        ? sections
        : [...sections, defaultSections.find((s) => s.title === "About")!]
      : defaultSections;
  const displayLegalLinks = legalLinks.length > 0 ? legalLinks : defaultLegalLinks;

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3
              className="text-gray-900 dark:text-white font-cursive font-bold text-2xl mb-3"
              style={{ WebkitTextStroke: "0.5px currentColor" }}
            >
              EventTara
            </h3>
            <p className="text-sm">{footerTagline}</p>
          </div>
          {displaySections.map((section, i) => (
            <div key={i}>
              <h4 className="text-gray-900 dark:text-white font-medium mb-3">{section.title}</h4>
              <div className="space-y-2 text-sm">
                {section.links?.map((link, j) => (
                  <Link
                    key={j}
                    href={link.url}
                    className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-sm text-center flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <span>
            &copy; {new Date().getFullYear()} EventTara. All rights reserved. A passion project by
            skjghisole.
          </span>
          {displayLegalLinks.map((link, i) => (
            <Link key={i} href={link.url} className="hover:text-gray-900 dark:hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
