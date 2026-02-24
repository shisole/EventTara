"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface ActivityCardProps {
  slug: string;
  label: string;
  icon: string;
  image: string;
  className?: string;
}

export default function ActivityCard({ slug, label, icon, image, className }: ActivityCardProps) {
  return (
    <Link
      href={`/events?type=${slug}`}
      className={cn("group relative overflow-hidden rounded-xl block", className)}
    >
      <Image
        src={image}
        alt={label}
        fill
        sizes="(max-width: 768px) 100vw, 200px"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {/* Dark overlay — lightens on hover */}
      <div className="absolute inset-0 bg-black/60 transition-colors duration-300 group-hover:bg-black/20" />
      {/* Label */}
      <div className="relative z-10 flex items-center gap-2 p-3">
        <span className="text-lg">{icon}</span>
        <span className="text-white font-semibold text-sm drop-shadow-md">{label}</span>
      </div>
    </Link>
  );
}
