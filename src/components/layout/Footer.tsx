import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-heading font-bold text-xl mb-3">
              EventTara
            </h3>
            <p className="text-sm">
              Tara na! &mdash; Your adventure starts here.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Explore</h4>
            <div className="space-y-2 text-sm">
              <Link href="/events" className="block hover:text-white">
                Browse Events
              </Link>
              <Link
                href="/events?type=hiking"
                className="block hover:text-white"
              >
                Hiking
              </Link>
              <Link href="/events?type=mtb" className="block hover:text-white">
                Mountain Biking
              </Link>
              <Link
                href="/events?type=running"
                className="block hover:text-white"
              >
                Running
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">For Organizers</h4>
            <div className="space-y-2 text-sm">
              <Link href="/signup" className="block hover:text-white">
                List Your Event
              </Link>
              <Link href="/dashboard" className="block hover:text-white">
                Organizer Dashboard
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          &copy; {new Date().getFullYear()} EventTara. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
