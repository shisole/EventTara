import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const pixelMap = { sm: 32, md: 48, lg: 64, xl: 96 };

export default function Avatar({ src, alt, size = "md", className }: AvatarProps) {
  const initials = alt
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (!src) {
    return (
      <div
        className={cn(
          "rounded-full bg-coral-100 text-coral-600 flex items-center justify-center font-semibold",
          sizeMap[size],
          className
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={pixelMap[size]}
      height={pixelMap[size]}
      className={cn("rounded-full object-cover", sizeMap[size], className)}
    />
  );
}
