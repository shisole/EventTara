import type { BorderSize, BorderTier } from "@/lib/constants/avatar-borders";
import {
  RING_THICKNESS,
  TIER_ANIMATION,
  TIER_COLORS,
  TIER_GRADIENTS,
} from "@/lib/constants/avatar-borders";

interface BorderCSS {
  className: string;
  style: React.CSSProperties;
}

/**
 * Returns the className and inline style for a border ring.
 * Common tier: solid colored ring.
 * Rare/Epic/Legendary: gradient ring via background on outer div.
 */
export function getBorderCSS(
  tier: BorderTier,
  size: BorderSize,
  borderColor?: string | null,
): BorderCSS {
  const thickness = RING_THICKNESS[size];
  const color = borderColor ?? TIER_COLORS[tier];
  const animation = TIER_ANIMATION[tier];

  if (tier === "common") {
    return {
      className: `rounded-full ${animation}`.trim(),
      style: {
        padding: thickness,
        background: color,
      },
    };
  }

  const gradient = TIER_GRADIENTS[tier];

  return {
    className: `rounded-full ${animation}`.trim(),
    style: {
      padding: thickness,
      background: gradient,
      backgroundSize: tier === "legendary" ? "200% 200%" : undefined,
    },
  };
}

/** Glow shadow for epic tier */
export function getGlowShadow(tier: BorderTier, borderColor?: string | null): string | undefined {
  if (tier !== "epic") return undefined;
  const color = borderColor ?? TIER_COLORS[tier];
  return `0 0 12px ${color}40, 0 0 24px ${color}20`;
}
