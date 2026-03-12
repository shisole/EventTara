import NewLandingPage from "@/components/landing/NewLandingPage";
import { getCachedHeroCarousel, parseHeroSlides } from "@/lib/cms/cached";

export const metadata = {
  title: "EventTara — Landing Page Preview",
  robots: { index: false, follow: false },
};

export default async function LandingPreview() {
  const heroData = await getCachedHeroCarousel();
  const heroSlides = parseHeroSlides(heroData);
  const transformedHeroData =
    heroSlides.length > 0
      ? {
          slides: heroSlides.map((s) => ({
            image: { url: s.url, mobileUrl: s.mobileUrl, alt: s.alt },
          })),
        }
      : null;

  return (
    <main>
      <NewLandingPage heroData={transformedHeroData} />
    </main>
  );
}
