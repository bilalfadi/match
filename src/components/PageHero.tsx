"use client";

import { useState } from "react";

const FALLBACK_FOOTBALL =
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1600&q=80";

interface PageHeroProps {
  title: string;
  subtitle: string;
  badge?: string;
  backgroundUrl: string;
}

export default function PageHero({
  title,
  subtitle,
  badge,
  backgroundUrl,
}: PageHeroProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(backgroundUrl);

  return (
    <section className="relative min-h-[40vh] flex items-center overflow-hidden border-b border-dark-border/60">
      <div className="absolute inset-0">
        {imgSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imgSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-70"
            onError={() =>
              setImgSrc((prev) =>
                prev === FALLBACK_FOOTBALL ? null : FALLBACK_FOOTBALL
              )
            }
          />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-70"
            style={{
              background:
                "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/60" />
      </div>
      <div className="relative z-10 container mx-auto px-4 py-10">
        <div className="max-w-3xl">
          {badge && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold mb-3 border border-primary/40">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {badge}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}

