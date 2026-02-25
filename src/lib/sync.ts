import type { IMatch, MatchStatus } from "./data/matches";
import { replaceSyncMatches } from "./data/matches";
import { fetchLiveMatchesWithEmbed } from "./sources";

const SYNC_SOURCE_URL = process.env.SYNC_SOURCE_URL ?? "";

/** Raw match shape from external JSON (your site's API). */
export interface SyncMatchInput {
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  streamUrl?: string;
  matchTime: string;
  status?: string;
  homeScore?: number;
  awayScore?: number;
}

function normalizeStatus(s: string | undefined): MatchStatus {
  const u = (s ?? "").toUpperCase();
  if (u === "LIVE" || u === "UPCOMING" || u === "FINISHED") return u as MatchStatus;
  if (u === "FT" || u === "ENDED" || u.includes("FINISH")) return "FINISHED";
  if (u.includes("LIVE") || u === "LIVE") return "LIVE";
  return "UPCOMING";
}

function normalizeMatch(raw: SyncMatchInput): Omit<IMatch, "_id" | "createdAt" | "updatedAt"> {
  return {
    homeTeam: String(raw.homeTeam ?? "").trim() || "Home",
    awayTeam: String(raw.awayTeam ?? "").trim() || "Away",
    homeLogo: raw.homeLogo?.trim() || "https://ui-avatars.com/api/?name=H&size=48&background=1a1a1a&color=666",
    awayLogo: raw.awayLogo?.trim() || "https://ui-avatars.com/api/?name=A&size=48&background=1a1a1a&color=666",
    status: normalizeStatus(raw.status),
    streamUrl: raw.streamUrl?.trim() || "",
    matchTime: raw.matchTime,
    homeScore: typeof raw.homeScore === "number" ? raw.homeScore : 0,
    awayScore: typeof raw.awayScore === "number" ? raw.awayScore : 0,
    source: "sync",
  };
}

/**
 * Sync from 3 sources (streameast.gl, xstreameast, livekora): all LIVE soccer matches
 * are saved (embed URL when available, else resolved on detail page open). Cards show below hero.
 */
export async function runSync(): Promise<{ synced: number; error?: string }> {
  try {
    const withEmbed = await fetchLiveMatchesWithEmbed();
    if (withEmbed.length === 0) {
      return { synced: 0 };
    }
    const list: Omit<IMatch, "_id" | "createdAt" | "updatedAt">[] = withEmbed.map((m) => ({
      homeTeam: (m.homeTeam ?? m.title.split(" vs ")[0]?.trim()) || "Home",
      awayTeam: (m.awayTeam ?? m.title.split(" vs ")[1]?.trim()) || "Away",
      homeLogo: "https://ui-avatars.com/api/?name=H&size=48&background=1a1a1a&color=666",
      awayLogo: "https://ui-avatars.com/api/?name=A&size=48&background=1a1a1a&color=666",
      status: "LIVE" as MatchStatus,
      streamUrl: m.embedUrl,
      sourceDetailUrl: m.url,
      matchTime: m.startTime,
      homeScore: m.homeScore ?? 0,
      awayScore: m.awayScore ?? 0,
      source: "sync" as const,
    }));
    const count = await replaceSyncMatches(list);
    return { synced: count };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (SYNC_SOURCE_URL) {
      try {
        const list = await fetchMatchesFromSource();
        const count = await replaceSyncMatches(list);
        return { synced: count };
      } catch {
        return { synced: 0, error: message };
      }
    }
    return { synced: 0, error: message };
  }
}

/**
 * Fetch matches from SYNC_SOURCE_URL (JSON API) – fallback when scrape fails.
 */
export async function fetchMatchesFromSource(): Promise<Omit<IMatch, "_id" | "createdAt" | "updatedAt">[]> {
  if (!SYNC_SOURCE_URL) return [];

  const res = await fetch(SYNC_SOURCE_URL, {
    next: { revalidate: 0 },
    headers: { "Cache-Control": "no-store" },
  });
  if (!res.ok) throw new Error(`Sync fetch failed: ${res.status} ${res.statusText}`);

  const data = (await res.json()) as { matches?: SyncMatchInput[] } | SyncMatchInput[];
  const rawList = Array.isArray(data) ? data : data.matches ?? [];
  const withStream = rawList.filter((m) => m && String(m.streamUrl ?? "").trim() !== "");
  return withStream.map(normalizeMatch);
}
