"use client";

import { useEffect, useState } from "react";
import MatchCard from "./MatchCard";

interface Match {
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

export default function LiveMatchesSection() {
  const [matches, setMatches] = useState<Match[]>([]);

  const fetchLive = () => {
    fetch("/api/matches?status=LIVE")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMatches(data);
        else setMatches([]);
      })
      .catch(() => setMatches([]));
  };

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 30000);
    return () => clearInterval(interval);
  }, []);

  if (matches.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-6 rounded bg-primary" />
        Live Matches
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((m) => (
          <MatchCard
            key={m.id}
            id={m.id}
            homeTeam={m.homeTeam}
            awayTeam={m.awayTeam}
            homeLogo={m.homeLogo}
            awayLogo={m.awayLogo}
            status={m.status}
            matchTime={m.matchTime}
            homeScore={m.homeScore}
            awayScore={m.awayScore}
          />
        ))}
      </div>
    </section>
  );
}
