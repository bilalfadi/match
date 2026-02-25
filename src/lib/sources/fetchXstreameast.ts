import * as cheerio from "cheerio";
import { safeFetch } from "./safeFetch";
import { parseMatchLine } from "./parseMatchLine";
import type { MatchSummary } from "./types";

const LIST_URL = "https://xstreameast.com/categories/soccer/";

export async function fetchXstreameastMatches(): Promise<MatchSummary[]> {
  const html = await safeFetch(LIST_URL);
  const $ = cheerio.load(html);
  const out: MatchSummary[] = [];

  $("a[href*='/match/']").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || !href.includes("/match/")) return;

    const fullUrl = href.startsWith("http") ? href : new URL(href, "https://xstreameast.com").href;
    const linkText = $(el).text().trim();

    let title = linkText;
    const $parent = $(el).closest("div, article, section, li");
    $parent.find("h1, h2, h3").each((_, h) => {
      const t = $(h).text().trim();
      if (t && t.length > 3 && !t.toLowerCase().includes("watch stream")) title = t;
    });
    if (!title || title.length < 3) title = linkText;

    const parsed = parseMatchLine(title);
    const isLive = $parent.text().toUpperCase().includes("LIVE") || linkText.toUpperCase().includes("LIVE");
    const status = isLive ? "LIVE" : parsed.status;
    const startTime = new Date().toISOString();

    out.push({
      source: "xstreameast",
      url: fullUrl,
      title: title || `${parsed.homeTeam} vs ${parsed.awayTeam}`,
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
