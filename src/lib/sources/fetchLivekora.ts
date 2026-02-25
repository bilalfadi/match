import * as cheerio from "cheerio";
import { safeFetch } from "./safeFetch";
import { parseMatchLine } from "./parseMatchLine";
import type { MatchSummary } from "./types";

const LIST_URL = "https://www.livekora.vip/";
const LIVEKORA_ORIGIN = "https://www.livekora.vip";

export async function fetchLivekoraMatches(): Promise<MatchSummary[]> {
  const html = await safeFetch(LIST_URL);
  const $ = cheerio.load(html);
  const out: MatchSummary[] = [];

  $("a[href^='http']").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const u = new URL(href);
      if (u.origin === LIVEKORA_ORIGIN || u.hostname.includes("livekora.vip")) return;
    } catch {
      return;
    }

    const text = $(el).text().trim();
    if (!text || text.length < 5) return;
    const hasScoreOrTime = /\d+[\s:–-]\d+/.test(text) || /\d{1,2}:\d{2}/.test(text);
    if (!hasScoreOrTime) return;

    const parsed = parseMatchLine(text);
    const status = parsed.status;
    const startTime = new Date().toISOString();
    const title = text || `${parsed.homeTeam} vs ${parsed.awayTeam}`;

    out.push({
      source: "livekora",
      url: href,
      title,
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
