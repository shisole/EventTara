import HeroBannerManager from "@/components/admin/HeroBannerManager";

// Video compression can take a while
export const maxDuration = 300;

export default function HeroBannersPage() {
  return (
    <div>
      <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">
        Hero Banners
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Manage the hero carousel slides shown on the homepage. Drag to reorder.
      </p>
      <HeroBannerManager />
    </div>
  );
}
