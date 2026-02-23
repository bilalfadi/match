"use client";

import Link from "next/link";
import Image from "next/image";

interface MatchCardProps {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  status: string;
  matchTime: string;
  homeScore?: number;
  awayScore?: number;
}

export default function MatchCard({
  id,
  homeTeam,
  awayTeam,
  homeLogo,
  awayLogo,
  status,
  matchTime,
  homeScore = 0,
  awayScore = 0,
}: MatchCardProps) {
  const isLive = status === "LIVE";
  const timeDisplay = isLive
    ? "LIVE"
    : new Date(matchTime).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });

  return (
    <Link
      href={`/match/${id}`}
      className="glass-card flex items-center justify-between gap-4 p-4 hover:border-primary/50 transition"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full overflow-hidden bg-dark-card">
          <Image
            src={homeLogo || "https://placehold.co/48/1a1a1a/666?text=1"}
            alt={homeTeam}
            fill
            className="object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://placehold.co/48/1a1a1a/666?text=H";
            }}
          />
        </div>
        <span className="font-medium text-white truncate">{homeTeam}</span>
      </div>
      <div className="flex flex-col items-center flex-shrink-0 px-2">
        {isLive ? (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary text-white text-xs font-bold animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            LIVE
          </span>
        ) : (
          <span className="text-xs text-gray-400">{timeDisplay}</span>
        )}
        <span className="text-lg font-bold text-white mt-1">
          {homeScore} - {awayScore}
        </span>
      </div>
      <div className="flex items-center gap-3 min-w-0 flex-1 justify-end">
        <span className="font-medium text-white truncate text-right">{awayTeam}</span>
        <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full overflow-hidden bg-dark-card">
          <Image
            src={awayLogo || "https://placehold.co/48/1a1a1a/666?text=2"}
            alt={awayTeam}
            fill
            className="object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://placehold.co/48/1a1a1a/666?text=A";
            }}
          />
        </div>
      </div>
    </Link>
  );
}
