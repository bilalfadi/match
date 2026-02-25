"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import TeamBadge from "@/components/TeamBadge";

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  status: string;
  streamUrl?: string;
  matchTime: string;
  homeScore?: number;
  awayScore?: number;
}

function validStreamUrl(url: string | undefined): url is string {
  if (!url || !url.trim()) return false;
  try {
    const u = new URL(url);
    const p = (u.pathname || "/").replace(/\/$/, "") || "/";
    return p !== "/";
  } catch {
    return false;
  }
}

export default function MatchDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/matches/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setMatch(null);
        else setMatch(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-32 bg-dark-card rounded-xl mb-6" />
          <div className="h-96 bg-dark-card rounded-xl" />
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Match not found</h1>
        <Link href="/" className="text-primary hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const isLive = match.status === "LIVE";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card flex flex-col sm:flex-row items-center justify-between gap-6 p-6 mb-6">
          <div className="flex items-center gap-4">
            <TeamBadge name={match.homeTeam} logoUrl={match.homeLogo ?? ""} size="lg" />
            <span className="text-xl font-bold text-white">{match.homeTeam}</span>
          </div>
          <div className="flex flex-col items-center">
            {isLive ? (
              <span className="flex items-center gap-1 px-3 py-1 rounded bg-primary text-white text-sm font-bold animate-pulse mb-2">
                <span className="w-2 h-2 rounded-full bg-white" />
                LIVE
              </span>
            ) : (
              <span className="text-sm text-gray-400 mb-2">
                {new Date(match.matchTime).toLocaleString()}
              </span>
            )}
            <span className="text-3xl font-bold text-white">
              {match.homeScore ?? 0} - {match.awayScore ?? 0}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-white">{match.awayTeam}</span>
            <TeamBadge name={match.awayTeam} logoUrl={match.awayLogo ?? ""} size="lg" />
          </div>
        </div>

        <div className="rounded-xl overflow-hidden bg-black border border-dark-border">
          {validStreamUrl(match.streamUrl) ? (
            <div className="relative w-full aspect-video">
              <iframe
                src={match.streamUrl!}
                title={`${match.homeTeam} vs ${match.awayTeam}`}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          ) : (
            <div className="aspect-video flex items-center justify-center text-gray-500 bg-dark-card">
              Stream not available
            </div>
          )}
        </div>

        <AdSlot position="below-iframe" className="mt-4 min-h-[90px]" />

        <div className="mt-6 text-center">
          <Link href="/" className="text-primary hover:underline font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
