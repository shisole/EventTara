"use client";

import { getBorderCSS, getGlowShadow } from "@/lib/borders/border-styles";
import type { BorderSize, BorderTier } from "@/lib/constants/avatar-borders";
import { GAP_THICKNESS } from "@/lib/constants/avatar-borders";
import { cn } from "@/lib/utils";

import Avatar from "./Avatar";

interface UserAvatarProps {
  src?: string | null;
  alt: string;
  size?: BorderSize;
  className?: string;
  borderTier?: BorderTier | null;
  borderColor?: string | null;
  onClick?: () => void;
}

export default function UserAvatar({
  src,
  alt,
  size = "md",
  className,
  borderTier,
  borderColor,
  onClick,
}: UserAvatarProps) {
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
          <Avatar src={src} alt={alt} size={size} />
        </div>
      );
    }
    return <Avatar src={src} alt={alt} size={size} className={className} />;
  }

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
        <Avatar src={src} alt={alt} size={size} />
      </div>
    </div>
  );
}
