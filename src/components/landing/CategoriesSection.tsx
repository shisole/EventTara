import Image from "next/image";
import Link from "next/link";

const categories = [
  {
    name: "Hiking",
    slug: "hiking",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1280&h=200&fit=crop",
  },
  {
    name: "Mountain Biking",
    slug: "mtb",
    image: "https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=1280&h=200&fit=crop",
  },
  {
    name: "Road Biking",
    slug: "road_bike",
    image: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=1280&h=200&fit=crop",
  },
  {
    name: "Running",
    slug: "running",
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1280&h=200&fit=crop",
  },
  {
    name: "Trail Running",
    slug: "trail_run",
    image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1280&h=200&fit=crop",
  },
];

export default function CategoriesSection() {
  return (
    <section className="py-12 bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center text-gray-900 dark:text-white mb-12">
          Find Your Adventure
        </h2>
        <div className="flex flex-col gap-4">
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/events?type=${cat.slug}`}
              className="relative h-32 sm:h-40 rounded-2xl overflow-hidden group"
            >
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="(max-width: 1280px) 95vw, 1280px"
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                quality={50}
                loading={i === 0 ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
              <div className="absolute inset-0 flex items-center px-6">
                <h3 className="text-white font-heading font-bold text-xl sm:text-2xl drop-shadow-lg">
                  {cat.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
