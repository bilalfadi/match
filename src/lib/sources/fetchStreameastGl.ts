import * as cheerio from "cheerio";
import { safeFetch } from "./safeFetch";
import { parseMatchLine } from "./parseMatchLine";
import type { MatchSummary } from "./types";

const BASE = "https://streameast.gl";
const LIST_URL = "https://streameast.gl/soccer";

export async function fetchStreameastGlMatches(): Promise<MatchSummary[]> {
  const html = await safeFetch(LIST_URL);
  const $ = cheerio.load(html);
  const out: MatchSummary[] = [];

  $("a[href*='/soccer/']").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const path = href.replace(/^\/+/, "").split("/");
    if (path[0] !== "soccer" || path.length < 2) return;
    const id = path[1];
    if (!/^\d+$/.test(id)) return;

    const fullUrl = href.startsWith("http") ? href : new URL(href, BASE).href;
    const text = $(el).text().trim();
    if (!text || text.length < 3) return;

    const parsed = parseMatchLine(text);
    const status = parsed.status;
    const startTime = new Date().toISOString();

    out.push({
      source: "streameast",
      url: fullUrl,
      title: `${parsed.homeTeam} vs ${parsed.awayTeam}`,
      startTime,
      status,
      homeTeam: parsed.homeTeam,
      awayTeam: parsed.awayTeam,
      homeScore: parsed.homeScore,
      awayScore: parsed.awayScore,
    });
  });

  return out;
}
