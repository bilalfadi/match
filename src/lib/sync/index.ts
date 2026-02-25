import { replaceSyncMatches } from "@/lib/data/matches";
import type { IMatch, MatchStatus } from "@/lib/data/matches";

interface RawMatch {
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  streamUrl?: string;
  matchTime: string | number | Date;
  status?: string;
  homeScore?: number;
  awayScore?: number;
}

interface ApiResponse {
  matches?: RawMatch[];
  [key: string]: unknown;
}

function normalizeStatus(status?: string): MatchStatus {
  if (!status) return "UPCOMING";
  const upper = status.toUpperCase();
  if (upper === "LIVE" || upper === "UPCOMING" || upper === "FINISHED") {
    return upper as MatchStatus;
  }
  return "UPCOMING";
}

function normalizeMatchTime(matchTime: string | number | Date): string {
  if (typeof matchTime === "number") {
    return new Date(matchTime).toISOString();
  }
  if (matchTime instanceof Date) {
    return matchTime.toISOString();
  }
  // Try to parse as ISO string or common formats
  const parsed = new Date(matchTime);
  if (isNaN(parsed.getTime())) {
    // If parsing fails, return current time as fallback
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

function normalizeMatch(raw: RawMatch): Omit<IMatch, "_id" | "createdAt" | "updatedAt"> {
  return {
    homeTeam: raw.homeTeam || "",
    awayTeam: raw.awayTeam || "",
    homeLogo: raw.homeLogo || "",
    awayLogo: raw.awayLogo || "",
    streamUrl: raw.streamUrl || "",
    matchTime: normalizeMatchTime(raw.matchTime),
    status: normalizeStatus(raw.status),
    homeScore: raw.homeScore ?? 0,
    awayScore: raw.awayScore ?? 0,
    source: "sync" as const,
  };
}

async function fetchMatchesFromUrl(url: string): Promise<RawMatch[]> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const data: ApiResponse | RawMatch[] = await response.json();

  // Handle both { matches: [...] } and direct array formats
  if (Array.isArray(data)) {
    return data;
  }
  if (data.matches && Array.isArray(data.matches)) {
    return data.matches;
  }
  throw new Error(`Invalid response format from ${url}: expected array or { matches: [...] }`);
}

export async function runSync(): Promise<{ synced: number } | { synced: 0; error: string }> {
  const sourceUrl = process.env.SYNC_SOURCE_URL;
  if (!sourceUrl) {
    return { synced: 0, error: "SYNC_SOURCE_URL environment variable is not set" };
  }

  const urls = sourceUrl.split(",").map((url) => url.trim()).filter((url) => url.length > 0);
  if (urls.length === 0) {
    return { synced: 0, error: "No valid URLs found in SYNC_SOURCE_URL" };
  }

  try {
    const allMatches: RawMatch[] = [];

    // Fetch from all URLs
    for (const url of urls) {
      try {
        const matches = await fetchMatchesFromUrl(url);
        allMatches.push(...matches);
      } catch (error) {
        console.error(`Error fetching from ${url}:`, error);
        // Continue with other URLs even if one fails
      }
    }

    if (allMatches.length === 0) {
      return { synced: 0, error: "No matches found from any source URL" };
    }

    // Normalize all matches
    const normalizedMatches = allMatches.map(normalizeMatch);

    // Replace sync matches
    const synced = await replaceSyncMatches(normalizedMatches);

    return { synced };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { synced: 0, error: `Sync failed: ${errorMessage}` };
  }
}
