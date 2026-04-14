import Link from "next/link";

export default function HostEventLink() {
  return (
    <Link
      href="/clubs/new"
      className="inline-flex items-center justify-center font-semibold rounded-xl text-base sm:text-lg py-3.5 px-6 sm:py-4 sm:px-8 border-2 border-white/40 text-white hover:border-lime-500 hover:text-lime-600 dark:hover:border-lime-400 dark:hover:text-lime-400 transition-colors"
    >
      Start a Club
    </Link>
  );
}
