import Link from "next/link";

export default function ContactCTASection() {
  return (
    <section className="py-12 bg-white dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-4">
          Have Questions?
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          Whether you need help with an event, have a partnership idea, or just want to say hello —
          we&apos;re here for you.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center font-semibold rounded-xl text-lg py-4 px-8 bg-lime-500 hover:bg-lime-400 text-slate-900 transition-colors"
        >
          Contact Us
        </Link>
      </div>
    </section>
  );
}
