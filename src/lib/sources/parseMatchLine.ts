/**
 * Parse "Team A vs Team B", optional score (0:0), time (20:00), status (LIVE/FT).
 * Returns homeTeam, awayTeam, homeScore, awayScore, status.
 */
export function parseMatchLine(text: string): {
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: "LIVE" | "UPCOMING" | "FINISHED";
} {
  const t = (text ?? "").trim();
  let homeTeam = "";
  let awayTeam = "";
  let homeScore: number | undefined;
  let awayScore: number | undefined;
  let status: "LIVE" | "UPCOMING" | "FINISHED" = "UPCOMING";

  const upper = t.toUpperCase();
  if (upper.includes("FT") || upper.includes("انتهت") || upper.includes("FINISHED") || upper.includes("ENDED")) {
    status = "FINISHED";
  } else if (upper.includes("LIVE") || upper.includes("جارية") || /\d+'\s*/.test(t) || /^\d+:\d+\s*-\s*\d+:\d+/.test(t)) {
    status = "LIVE";
  }

  // Score like "2 - 0" or "0:0" or "2-1"
  const scoreMatch = t.match(/(\d+)\s*[-–:]\s*(\d+)/);
  if (scoreMatch) {
    homeScore = parseInt(scoreMatch[1], 10);
    awayScore = parseInt(scoreMatch[2], 10);
  }

  // "Team A vs Team B" or "Team A v Team B"
  const vsMatch = t.match(/^(.+?)\s+(?:vs?\.?|v)\s+(.+)$/i);
  if (vsMatch) {
    homeTeam = vsMatch[1].replace(/\s*\d+'\s*$/, "").replace(/\s*\d+:\d+\s*-\s*\d+:\d+.*$/, "").trim();
    awayTeam = vsMatch[2].replace(/^\d+:\d+\s*-\s*\d+:\d+\s*/, "").replace(/\s*\(.*\)$/, "").trim();
  } else {
    homeTeam = t.split(/\s+vs\.?\s+/i)[0]?.trim() ?? t;
    awayTeam = t.split(/\s+vs\.?\s+/i)[1]?.trim() ?? "";
  }

  return { homeTeam: homeTeam || "Home", awayTeam: awayTeam || "Away", homeScore, awayScore, status };
}
