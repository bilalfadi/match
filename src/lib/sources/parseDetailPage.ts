import * as cheerio from "cheerio";
import { safeFetch } from "./safeFetch";
import { parseStreamIframeFromHtml, isInvalidEmbedUrl, isListingOrNavUrl } from "./parseStreamIframeFromHtml";

/** "everton-vs-man-united" -> { home: "Everton", away: "Man United" } */
function teamsFromSlug(slug: string): { home: string; away: string } {
  const s = (slug.replace(/^\//, "").split("/").pop() || "").trim();
  const parts = s.split(/-vs-|-v-/i).map((p) =>
    p
      .replace(/-/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return { home: parts[0], away: parts[1] };
  }
  return { home: "Home", away: "Away" };
}

/** "<title>Everton vs Manchester United Live stream</title>" -> { home: "Everton", away: "Manchester United" } */
function teamsFromTitle(title: string): { home: string; away: string } | null {
  const t = (title || "").trim();
  const vsMatch = t.match(/(.+?)\s+vs\.?\s+(.+?)(?:\s+[-–|]|\s+Live|$)/i) || t.match(/(.+?)\s+vs\.?\s+(.+)/i);
  if (vsMatch) {
    const home = vsMatch[1].trim();
    const away = vsMatch[2].trim().replace(/\s+Live\s+stream.*$/i, "").replace(/\s+Live\s*$/i, "").trim();
    if (home && away) return { home, away };
  }
  return null;
}

export interface ParsedMatchFromDetail {
  homeTeam: string;
  awayTeam: string;
  streamUrl: string;
  sourceDetailUrl: string;
}

/**
 * Fetch detail page URL, parse team names (title or URL slug) and embed URL.
 * Baaki sab khud: logos = avatar from initial, status/matchTime caller de sakta hai.
 */
export async function parseMatchFromDetailUrl(detailUrl: string): Promise<ParsedMatchFromDetail> {
  const url = detailUrl.trim();
  if (!url.startsWith("http")) throw new Error("Invalid URL");

  const html = await safeFetch(url);
  const $ = cheerio.load(html);

  let homeTeam = "Home";
  let awayTeam = "Away";

  const title = $("title").first().text() || "";
  const fromTitle = teamsFromTitle(title);
  if (fromTitle) {
    homeTeam = fromTitle.home;
    awayTeam = fromTitle.away;
  } else {
    try {
      const u = new URL(url);
      const slug = u.pathname.replace(/^\//, "").split("/").pop() || "";
      if (slug) {
        const fromSlug = teamsFromSlug(slug);
        homeTeam = fromSlug.home;
        awayTeam = fromSlug.away;
      }
    } catch {}
  }

  let streamUrl = "";
  const resolved = parseStreamIframeFromHtml(html, url);
  if (resolved && resolved.trim() && !isInvalidEmbedUrl(resolved) && !isListingOrNavUrl(resolved, url)) {
    streamUrl = resolved.trim();
  }

  return {
    homeTeam,
    awayTeam,
    streamUrl,
    sourceDetailUrl: url,
  };
}
