import { readJson, writeJson, generateId } from "../store";

export type MatchStatus = "LIVE" | "UPCOMING" | "FINISHED";

export type MatchSource = "sync" | "manual";

export interface IMatch {
  _id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  status: MatchStatus;
  streamUrl?: string;
  /** Source match detail page URL – used to fetch page and extract iframe embed URL when opening our detail page */
  sourceDetailUrl?: string;
  matchTime: string;
  homeScore?: number;
  awayScore?: number;
  source?: MatchSource;
  createdAt: string;
  updatedAt: string;
}

const FILE = "matches.json";

async function getMatches(): Promise<IMatch[]> {
  return readJson<IMatch[]>(FILE);
}

async function saveMatches(matches: IMatch[]): Promise<void> {
  await writeJson(FILE, matches);
}

export async function findMatches(status?: MatchStatus): Promise<IMatch[]> {
  let matches = await getMatches();
  if (status) matches = matches.filter((m) => m.status === status);
  matches.sort((a, b) => new Date(b.matchTime).getTime() - new Date(a.matchTime).getTime());
  return matches;
}

export async function findMatchById(id: string): Promise<IMatch | null> {
  const matches = await getMatches();
  return matches.find((m) => m._id === id) ?? null;
}

export async function createMatch(data: {
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  status: MatchStatus;
  streamUrl?: string;
  sourceDetailUrl?: string;
  matchTime: string;
  homeScore?: number;
  awayScore?: number;
  source?: MatchSource;
}): Promise<IMatch> {
  const matches = await getMatches();
  const now = new Date().toISOString();
  const match: IMatch = {
    _id: generateId(),
    homeTeam: data.homeTeam,
    awayTeam: data.awayTeam,
    homeLogo: data.homeLogo,
    awayLogo: data.awayLogo,
    status: data.status,
    streamUrl: data.streamUrl ?? "",
    sourceDetailUrl: data.sourceDetailUrl ?? "",
    matchTime: data.matchTime,
    homeScore: data.homeScore ?? 0,
    awayScore: data.awayScore ?? 0,
    source: data.source ?? "manual",
    createdAt: now,
    updatedAt: now,
  };
  matches.push(match);
  await saveMatches(matches);
  return match;
}

export async function updateMatch(id: string, data: Partial<Omit<IMatch, "_id" | "createdAt">>): Promise<IMatch | null> {
  const matches = await getMatches();
  const idx = matches.findIndex((m) => m._id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  matches[idx] = { ...matches[idx], ...data, _id: id, createdAt: matches[idx].createdAt, updatedAt: now };
  await saveMatches(matches);
  return matches[idx];
}

export async function deleteMatch(id: string): Promise<boolean> {
  const matches = await getMatches();
  const filtered = matches.filter((m) => m._id !== id);
  if (filtered.length === matches.length) return false;
  await saveMatches(filtered);
  return true;
}

/** Replace all matches that came from sync with the new list. Keeps manual matches. */
export async function replaceSyncMatches(syncMatches: Omit<IMatch, "_id" | "createdAt" | "updatedAt">[]): Promise<number> {
  const matches = await getMatches();
  const manual = matches.filter((m) => m.source === "manual" || m.source == null);
  const now = new Date().toISOString();
  const newSync: IMatch[] = syncMatches.map((m) => ({
    ...m,
    _id: generateId(),
    source: "sync" as const,
    createdAt: now,
    updatedAt: now,
  }));
  await saveMatches([...manual, ...newSync]);
  return newSync.length;
}
