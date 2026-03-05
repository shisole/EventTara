import { type Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About EventTara - Built by a Hiker in Iloilo | Stephen Hisole",
  description:
    "The story of how EventTara started from one hiker's journey through Panay Island's trails - from Mt. Igatmon to building a platform for adventurers across the Philippines.",
  openGraph: {
    title: "About EventTara - Built by a Hiker in Iloilo",
    description: "From two bikes to every mountain - the story behind EventTara.",
    images: ["/images/about/hero.jpg"],
  },
};

export default function AboutPage() {
  return (
    <main className="bg-white dark:bg-slate-900">
      {/* Hero Section */}
      <section className="relative h-[400px] sm:h-[500px] flex items-center justify-center">
        <Image
          src="/images/about/hero.jpg"
          alt="Trail running in Panay Island"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-white mb-4">
            From Two Bikes to Every Mountain
          </h1>
          <p className="text-xl sm:text-2xl text-gray-200 max-w-3xl mx-auto">
            How one hiker&apos;s journey through Iloilo&apos;s trails became EventTara
          </p>
        </div>
      </section>

      {/* Content will be added in next task */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-gray-600 dark:text-gray-400">Content sections coming next...</p>
      </div>
    </main>
  );
}
