import { isActivityFeedEnabled } from "@/lib/cms/cached";
import { fetchFeedPreviewItems } from "@/lib/feed/preview";

import FeedParallaxCards from "./FeedParallaxCards";
import ParallaxMountain from "./ParallaxMountain";

interface FeedShowcaseSectionProps {
  imageUrl: string;
}

export default async function FeedShowcaseSection({ imageUrl }: FeedShowcaseSectionProps) {
  const enabled = await isActivityFeedEnabled();

  if (!enabled) {
    return <ParallaxMountain imageUrl={imageUrl} />;
  }

  const items = await fetchFeedPreviewItems();

  if (items.length === 0) {
    return <ParallaxMountain imageUrl={imageUrl} />;
  }

  return (
    <ParallaxMountain imageUrl={imageUrl}>
      <FeedParallaxCards items={items} />
    </ParallaxMountain>
  );
}
