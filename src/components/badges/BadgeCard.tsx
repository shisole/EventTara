import Image from "next/image";
import Link from "next/link";
import { resolvePresetImage } from "@/lib/constants/avatars";
import { RARITY_STYLES, CATEGORY_STYLES } from "@/lib/constants/badge-rarity";
import { cn } from "@/lib/utils";

interface BadgeCardProps {
  id: string;
  title: string;
  eventName: string;
  imageUrl: string | null;
  awardedAt: string;
  category?: "distance" | "adventure" | "location" | "special";
  rarity?: "common" | "rare" | "epic" | "legendary";
}

export default function BadgeCard({
  id,
  title,
  eventName,
  imageUrl,
  awardedAt,
  category,
  rarity,
}: BadgeCardProps) {
  const resolved = resolvePresetImage(imageUrl);
  const rarityStyle = RARITY_STYLES[rarity || "common"];
  const categoryStyle = category ? CATEGORY_STYLES[category] : null;

  return (
    <Link href={`/badges/${id}`} className="block">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-4 text-center hover:shadow-lg transition-shadow">
        <div
          className={cn(
            "w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center overflow-hidden",
            resolved?.type === "emoji" ? resolved.color : "bg-golden-100",
            rarityStyle.ring,
            rarityStyle.glow,
          )}
        >
          {resolved?.type === "url" ? (
            <Image src={resolved.url} alt={title} width={80} height={80} className="object-cover" />
          ) : (
            <span className="text-3xl">
              {resolved?.type === "emoji" ? resolved.emoji : "\u{1F3C6}"}
            </span>
          )}
        </div>
        <h3 className="font-heading font-bold text-sm">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{eventName}</p>
        {categoryStyle && (
          <span
            className={cn("inline-block text-xs px-2 py-0.5 rounded-full mt-1", categoryStyle.pill)}
          >
            {categoryStyle.label}
          </span>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {new Date(awardedAt).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </Link>
  );
}
