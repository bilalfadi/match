"use client";

import Link from "next/link";
import TeamBadge from "./TeamBadge";

/** Clean team name: remove score/time prefix like "23' \n\t Man United" -> "Man United" */
function cleanTeamName(raw: string): string {
  const s = (raw || "").trim();
  const withoutPrefix = s.replace(/^\d+['\u2019]?\s*[\n\t\s]*/i, "").trim();
  return withoutPrefix || s || "—";
}

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
  homeFlagUrl?: string;
  awayFlagUrl?: string;
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
  const home = cleanTeamName(homeTeam);
  const away = cleanTeamName(awayTeam);
  const isLive = status === "LIVE";
  const timeDisplay = isLive
    ? "LIVE"
    : new Date(matchTime).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });

  return (
    <Link href={`/match/${id}`} className="block w-full max-w-4xl group">
      <div className="glass-card flex items-center gap-1.5 sm:gap-3 p-2 sm:p-3 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 rounded-xl border border-dark-border/80">
        {/* Home: logo + name */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <TeamBadge name={home} logoUrl={homeLogo ?? ""} size="lg" />
          <span className="font-semibold text-white text-xs sm:text-sm truncate" title={home}>
            {home}
          </span>
        </div>

        {/* Center: score + LIVE/time */}
        <div className="flex flex-col items-center justify-center flex-shrink-0 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-md bg-dark-bg/90 border border-dark-border min-w-[56px] sm:min-w-[80px]">
          {isLive ? (
            <span className="flex items-center gap-1 px-1 py-0.5 rounded-full bg-primary/25 text-primary text-[10px] font-bold mb-0.5">
              <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
              {timeDisplay}
            </span>
          ) : (
            <span className="text-[10px] text-gray-400 mb-0.5">{timeDisplay}</span>
          )}
          <span className="text-base sm:text-xl font-bold text-white tabular-nums leading-tight">
            {homeScore}
            <span className="text-gray-500 font-normal mx-0.5">–</span>
            {awayScore}
          </span>
        </div>

        {/* Away: name + logo */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
          <span className="font-semibold text-white text-xs sm:text-sm truncate text-right" title={away}>
            {away}
          </span>
          <TeamBadge name={away} logoUrl={awayLogo ?? ""} size="lg" />
        </div>

        {/* Watch */}
        <div className="flex-shrink-0">
          <span className="inline-flex items-center justify-center px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-primary text-white text-xs font-semibold group-hover:bg-red-600 transition-colors">
            Watch
          </span>
        </div>
      </div>
    </Link>
  );
}
