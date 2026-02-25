"use client";

import { useState } from "react";
import Image from "next/image";

export function teamInitial(name: string): string {
  const t = (name || "").trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
  return t.slice(0, 2).toUpperCase();
}

const PLACEHOLDER_PATTERNS = [
  "ui-avatars.com",
  "placehold.co",
];

function isPlaceholderUrl(url: string): boolean {
  if (!url || !url.trim()) return true;
  return PLACEHOLDER_PATTERNS.some((p) => url.includes(p));
}

/** Jab real logo na ho to yeh image dikhao – word/letter logo nahi */
const DEFAULT_TEAM_IMAGE =
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=96&h=96&fit=crop";

export default function TeamBadge({
  name,
  logoUrl,
  size = "md",
}: {
  name: string;
  logoUrl: string;
  size?: "md" | "lg" | "xl";
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const sizeMap = {
    md: "w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-base",
    lg: "w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl",
    xl: "w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-2xl",
  };
  const sizeClass = sizeMap[size] || sizeMap.lg;
  const hasValidLogo = logoUrl && !isPlaceholderUrl(logoUrl) && !imgFailed;

  if (hasValidLogo) {
    return (
      <div
        className={`relative flex-shrink-0 rounded-full overflow-hidden bg-dark-card ring-2 ring-white/10 shadow-md ${sizeClass}`}
      >
        <Image
          src={logoUrl}
          alt={name}
          fill
          className="object-contain p-0.5"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex-shrink-0 rounded-full overflow-hidden bg-dark-card ring-2 ring-white/10 shadow-md ${sizeClass}`}
      title={name}
    >
      <Image
        src={DEFAULT_TEAM_IMAGE}
        alt={name}
        fill
        className="object-cover opacity-90"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
}
