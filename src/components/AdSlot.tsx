"use client";

import { useEffect, useState } from "react";

type AdPosition =
  | "hero"
  | "home-between-sections"
  | "post-content"
  | "above-iframe"
  | "below-iframe"
  | "sidebar";

interface AdSlotProps {
  position: AdPosition;
  className?: string;
}

interface AdItem {
  id: string;
  position: string;
  code: string;
  active: boolean;
}

export default function AdSlot({ position, className = "" }: AdSlotProps) {
  const [ad, setAd] = useState<AdItem | null>(null);

  useEffect(() => {
    fetch(`/api/ads?position=${position}`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        if (list.length > 0) setAd(list[0]);
      })
      .catch(() => {});
  }, [position]);

  if (!ad?.code?.trim()) {
    return (
      <div
        className={`flex items-center justify-center min-h-[90px] bg-dark-card/50 rounded-lg border border-dark-border text-gray-500 text-sm ${className}`}
      >
        Ad slot
      </div>
    );
  }

  return (
    <div
      className={`ad-slot overflow-hidden rounded-lg ${className}`}
      dangerouslySetInnerHTML={{ __html: ad.code }}
    />
  );
}
