"use client";

import Image from "next/image";

import { getBorderCSS, getGlowShadow } from "@/lib/borders/border-styles";
import { type BorderSize, type BorderTier } from "@/lib/constants/avatar-borders";
import { GAP_THICKNESS } from "@/lib/constants/avatar-borders";
import { cn } from "@/lib/utils";

import UserAvatar from "./UserAvatar";

interface AvatarConfig {
  animalImageUrl?: string | null;
  accessoryImageUrl?: string | null;
  backgroundImageUrl?: string | null;
  skinImageUrl?: string | null;
}

interface CompositeAvatarProps {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  borderTier?: BorderTier | null;
  borderColor?: string | null;
  avatarConfig?: AvatarConfig | null;
  onClick?: () => void;
}

const sizeMap: Record<BorderSize, string> = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const pixelMap: Record<BorderSize, number> = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

const DEFAULT_BG_COLOR = "bg-teal-100 dark:bg-teal-900";

export default function CompositeAvatar({
  src,
  alt,
  size = "md",
  className,
  borderTier,
  borderColor,
  avatarConfig,
  onClick,
}: CompositeAvatarProps) {
  // If no animal avatar configured, delegate entirely to UserAvatar
  if (!avatarConfig?.animalImageUrl) {
    return (
      <UserAvatar
        src={src}
        alt={alt}
        size={size}
        className={className}
        borderTier={borderTier}
        borderColor={borderColor}
        onClick={onClick}
      />
    );
  }

  const pixels = pixelMap[size];
  const animalSrc = avatarConfig.skinImageUrl ?? avatarConfig.animalImageUrl;

  const compositeContent = (
    <div className={cn("relative overflow-hidden rounded-full flex-shrink-0", sizeMap[size])}>
      {/* Background layer (z-0) */}
      {avatarConfig.backgroundImageUrl ? (
        <Image
          src={avatarConfig.backgroundImageUrl}
          alt=""
          width={pixels}
          height={pixels}
          className="absolute inset-0 z-0 h-full w-full object-cover"
          aria-hidden="true"
        />
      ) : (
        <div className={cn("absolute inset-0 z-0", DEFAULT_BG_COLOR)} aria-hidden="true" />
      )}

      {/* Animal layer (z-10) */}
      <Image
        src={animalSrc}
        alt={alt}
        width={pixels}
        height={pixels}
        className="absolute inset-0 z-10 h-full w-full object-contain"
      />

      {/* Accessory layer (z-20) */}
      {avatarConfig.accessoryImageUrl ? (
        <Image
          src={avatarConfig.accessoryImageUrl}
          alt=""
          width={pixels}
          height={pixels}
          className="absolute inset-0 z-20 h-full w-full object-contain"
          aria-hidden="true"
        />
      ) : null}
    </div>
  );

  // Without border tier — simple wrapper
  if (!borderTier) {
    if (onClick) {
      return (
        <div
          className={cn("inline-flex cursor-pointer", className)}
          onClick={onClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick();
            }
          }}
        >
          {compositeContent}
        </div>
      );
    }
    return <div className={cn("inline-flex", className)}>{compositeContent}</div>;
  }

  // With border tier — wrap with border ring
  const { className: borderClassName, style: borderStyle } = getBorderCSS(
    borderTier,
    size,
    borderColor,
  );
  const glowShadow = getGlowShadow(borderTier, borderColor);

  return (
    <div
      className={cn("inline-flex flex-shrink-0", borderClassName, className)}
      style={{
        ...borderStyle,
        boxShadow: glowShadow,
      }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div
        className="rounded-full bg-white dark:bg-gray-900"
        style={{ padding: GAP_THICKNESS[size] }}
      >
        {compositeContent}
      </div>
    </div>
  );
}
