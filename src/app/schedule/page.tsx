"use client";

import { useEffect, useState } from "react";
import MatchCard from "@/components/MatchCard";
import PageHero from "@/components/PageHero";

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

export default function SchedulePage() {
  const [live, setLive] = useState<Match[]>([]);
  const [upcoming, setUpcoming] = useState<Match[]>([]);
  const [finished, setFinished] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMatches = () => {
    Promise.all([
      fetch("/api/matches?status=LIVE").then((r) => r.json()),
      fetch("/api/matches?status=UPCOMING").then((r) => r.json()),
      fetch("/api/matches?status=FINISHED").then((r) => r.json()),
    ])
      .then(([liveData, upcomingData, finishedData]) => {
        setLive(Array.isArray(liveData) ? liveData : []);
        setUpcoming(Array.isArray(upcomingData) ? upcomingData : []);
        setFinished(Array.isArray(finishedData) ? finishedData : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMatches();
    const interval = setInterval(loadMatches, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <>
        <PageHero
          title="Football Schedule"
          subtitle="Check today’s live fixtures, upcoming clashes and recently finished matches — all in one place."
          badge="Fixtures"
          backgroundUrl="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&q=80"
        />
        <div className="container mx-auto px-4 py-12">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-dark-card rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHero
        title="Football Schedule"
        subtitle="Live, upcoming and finished matches — filter by what’s happening right now."
        badge="Fixtures"
        backgroundUrl="https://images.unsplash.com/photo-1522778119026-d647f0596c4c?w=1600&q=80"
      />
      <div className="container mx-auto px-4 py-8">
        {live.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-5 rounded bg-primary" />
              Live Now
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {live.map((m) => (
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
        )}

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-5 rounded bg-primary" />
            Upcoming
          </h2>
          {upcoming.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((m) => (
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
          ) : (
            <p className="text-gray-400">No upcoming matches.</p>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-5 rounded bg-gray-500" />
            Finished
          </h2>
          {finished.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {finished.map((m) => (
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
          ) : (
            <p className="text-gray-400">No finished matches.</p>
          )}
        </section>
      </div>
    </>
  );
}
