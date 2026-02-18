import Link from "next/link";
import { Button } from "@/components/ui";

const categories = [
  {
    emoji: "\u{1F3D4}\uFE0F",
    name: "Hiking",
    slug: "hiking",
    description: "Explore scenic trails and conquer peaks with fellow hikers.",
  },
  {
    emoji: "\u{1F6B5}",
    name: "Mountain Biking",
    slug: "mtb",
    description: "Shred single-track trails and push your limits off-road.",
  },
  {
    emoji: "\u{1F6B4}",
    name: "Road Biking",
    slug: "road-biking",
    description: "Ride long-distance routes through stunning countryside.",
  },
  {
    emoji: "\u{1F3C3}",
    name: "Running",
    slug: "running",
    description: "From fun runs to marathons, find your next race day.",
  },
  {
    emoji: "\u26F0\uFE0F",
    name: "Trail Running",
    slug: "trail-running",
    description: "Hit the dirt trails for an off-road running adventure.",
  },
];

const steps = [
  {
    icon: "\u{1F50D}",
    title: "Browse Events",
    description: "Discover adventure events happening near you or across the country.",
  },
  {
    icon: "\u{1F3AB}",
    title: "Book Your Spot",
    description: "Reserve your slot in seconds. No hassle, no long forms.",
  },
  {
    icon: "\u{1F3D4}\uFE0F",
    title: "Go Adventure!",
    description: "Show up, have fun, and collect badges for your achievements.",
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-coral-50 via-white to-golden-50 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-7xl font-heading font-bold text-gray-900 mb-4">
            Tara na!
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Book Your Next Adventure. Discover hiking, biking, running events
            and more across the Philippines.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/events">
              <Button size="lg">Explore Events</Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" size="lg">
                List Your Event
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="text-5xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Event Categories */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center text-gray-900 mb-12">
            Find Your Adventure
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/events?type=${cat.slug}`}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 group"
              >
                <div className="text-4xl mb-3">{cat.emoji}</div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-coral-500 transition-colors mb-1">
                  {cat.name}
                </h3>
                <p className="text-sm text-gray-500">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Organizer CTA */}
      <section className="py-20 bg-forest-500">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4">
            Run Adventure Events?
          </h2>
          <p className="text-lg text-forest-100 mb-8">
            List them on EventTara and reach thousands of adventure seekers.
            Manage registrations, check-ins, and more — all in one place.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-white text-forest-600 hover:bg-gray-100"
            >
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
